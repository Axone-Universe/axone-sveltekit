import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UserBuilder } from '$lib/nodes/user';
import { UsersRepository } from '$lib/repositories/UsersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { formDataSchema } from '$lib/util/schemas';
import type { FictionalGenres, NonFictionalGenres } from '$lib/util/types';

export const users = t.router({
	list: t.procedure
		.use(logger)
		.input(z.string().optional())
		.query(async ({ input }) => {
			const usersRepo = new UsersRepository();

			const result = await usersRepo.getUsers(input);

			return result;
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(formDataSchema)
		.query(async ({ input, ctx }) => {
			// session should always be there since auth would have passed by now
			// but have to check anyway otherwise Typescript complains
			if (!ctx.session?.user.id) throw new TRPCError({ code: 'UNAUTHORIZED' });

			let userBuilder = await new UserBuilder()
				.id(ctx.session.user.id)
				.firstName(input.firstName)
				.lastName(input.lastName);

			if (input.about) userBuilder = userBuilder.about(input.about);
			if (input.facebook) userBuilder = userBuilder.facebook(input.facebook);
			if (input.instagram) userBuilder = userBuilder.instagram(input.instagram);
			if (input.twitter) userBuilder = userBuilder.twitter(input.twitter);

			if (input.fictional) {
				const fictional = Object.keys(input.fictional).filter(
					(key: keyof FictionalGenres) => (input.fictional as FictionalGenres)[key]
				);
				if (fictional.length > 0) userBuilder = userBuilder.fictional(fictional);
			}

			if (input.nonFictional) {
				const nonFictional = Object.keys(input.nonFictional).filter(
					(key: keyof NonFictionalGenres) => (input.nonFictional as NonFictionalGenres)[key]
				);

				if (nonFictional.length > 0) userBuilder = userBuilder.nonFictional(nonFictional);
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
