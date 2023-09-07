import { UserBuilder } from '$lib/documents/user';
import { UsersRepository } from '$lib/repositories/usersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, update } from '$lib/trpc/schemas/users';
import { search } from '$lib/trpc/schemas/shared';

const usersRepo = new UsersRepository();

export const users = t.router({
	list: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input, ctx }) => {
			const result = await usersRepo.getAll(ctx.session, input?.limit, input?.skip);

			return result;
		}),

	getById: t.procedure
		.use(logger)
		.input(search)
		.query(async ({ input, ctx }) => {
			const result = await usersRepo.getById(ctx.session, input.searchTerm);

			return result;
		}),

	getByDetails: t.procedure
		.use(logger)
		.input(search)
		.query(async ({ input, ctx }) => {
			const result = await usersRepo.getByDetails(ctx.session, input.searchTerm ?? '');

			return result;
		}),
	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			let userBuilder = new UserBuilder(ctx.session!.user.id)
				.firstName(input.firstName!)
				.lastName(input.lastName!);

			if (input.imageURL) userBuilder = userBuilder.about(input.imageURL);
			if (input.about) userBuilder = userBuilder.about(input.about);
			if (input.email) userBuilder = userBuilder.email(input.email);
			if (input.facebook) userBuilder = userBuilder.facebook(input.facebook);
			if (input.instagram) userBuilder = userBuilder.instagram(input.instagram);
			if (input.twitter) userBuilder = userBuilder.twitter(input.twitter);
			if (input.genres) userBuilder = userBuilder.genres(input.genres);
			if (input.labels) userBuilder = userBuilder.labels(input.labels);

			const user = await userBuilder.update();

			return user;
		}),
	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			let userBuilder = new UserBuilder(ctx.session!.user.id)
				.firstName(input.firstName!)
				.lastName(input.lastName!);

			if (input.imageURL) userBuilder = userBuilder.about(input.imageURL);
			if (input.about) userBuilder = userBuilder.about(input.about);
			if (input.email) userBuilder = userBuilder.email(input.email);
			if (input.facebook) userBuilder = userBuilder.facebook(input.facebook);
			if (input.instagram) userBuilder = userBuilder.instagram(input.instagram);
			if (input.twitter) userBuilder = userBuilder.twitter(input.twitter);
			if (input.genres) userBuilder = userBuilder.genres(input.genres);
			if (input.labels) userBuilder = userBuilder.labels(input.labels);

			const user = await userBuilder.build();

			return user;
		})
});
