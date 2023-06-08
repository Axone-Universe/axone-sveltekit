import { TRPCError } from '@trpc/server';

import { UserBuilder } from '$lib/nodes/user';
import { UsersRepository } from '$lib/repositories/usersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { createUserSchema, listSchema } from '$lib/trpc/schemas';
import type { Genres } from '$lib/util/types';

const usersRepo = new UsersRepository();

export const users = t.router({
	list: t.procedure
		.use(logger)
		.input(listSchema.optional())
		.query(async ({ input }) => {
			const result = await usersRepo.get(input?.searchTerm, input?.limit, input?.skip);

			return result;
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(createUserSchema)
		.mutation(async ({ input, ctx }) => {
			// session should always be there since auth would have passed by now
			// but have to check anyway otherwise Typescript complains
			if (!ctx.session?.user.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

			let userBuilder = await new UserBuilder()
				.id(ctx.session.user.id)
				.firstName(input.firstName)
				.lastName(input.lastName);

			if (input.imageURL) userBuilder = userBuilder.about(input.imageURL);
			if (input.about) userBuilder = userBuilder.about(input.about);
			if (input.facebook) userBuilder = userBuilder.facebook(input.facebook);
			if (input.instagram) userBuilder = userBuilder.instagram(input.instagram);
			if (input.twitter) userBuilder = userBuilder.twitter(input.twitter);

			if (input.genres) {
				const genres = Object.keys(input.genres).filter(
					(key) => (input.genres as Genres)[key as keyof Genres]
				);
				if (genres.length > 0) userBuilder = userBuilder.genres(genres);
			}

			const labels = ['User'];
			if (input.userWriterChecked) labels.push('Writer');
			if (input.userEditorChecked) labels.push('Editor');
			if (input.userIllustratorChecked) labels.push('Illustrator');

			userBuilder = userBuilder.labels(labels);

			const userNode = await userBuilder.build();

			return userNode;
		})
});
