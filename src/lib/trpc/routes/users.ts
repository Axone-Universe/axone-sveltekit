import { UserBuilder } from '$lib/documents/user';
import { UsersRepository } from '$lib/repositories/usersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import {
	create,
	createDeleteReadingList,
	read,
	getReadingList,
	update,
	updateReadingLists,
	renameReadingList
} from '$lib/trpc/schemas/users';

export const users = t.router({
	list: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();
			const result = await usersRepo.get(ctx.session, input.id);

			return result;
		}),

	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();
			const result = await usersRepo.getById(ctx.session, input.id);

			return result;
		}),

	getByDetails: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();
			const result = await usersRepo.getByDetails(ctx.session, input.detail ?? '');

			return result;
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			let userBuilder = new UserBuilder(ctx.session!.user.id);

			if (input.firstName) userBuilder = userBuilder.firstName(input.firstName);
			if (input.lastName) userBuilder = userBuilder.lastName(input.lastName);

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
		}),

	getReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(getReadingList)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();
			const result = await usersRepo.getReadingList(ctx.session!.user.id, input.name);

			return result;
		}),

	createReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(createDeleteReadingList)
		.mutation(async ({ input, ctx }) => {
			const user = new UserBuilder(ctx.session!.user.id).createReadingList(input);

			return user;
		}),

	deleteReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(createDeleteReadingList)
		.mutation(async ({ input, ctx }) => {
			const user = new UserBuilder(ctx.session!.user.id).deleteReadingList(input);

			return user;
		}),

	renameReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(renameReadingList)
		.mutation(async ({ input, ctx }) => {
			const user = new UserBuilder(ctx.session!.user.id).renameReadingList(input);

			return user;
		}),

	updateReadingLists: t.procedure
		.use(logger)
		.use(auth)
		.input(updateReadingLists)
		.mutation(async ({ input, ctx }) => {
			const user = new UserBuilder(ctx.session!.user.id).updateReadingLists(input);

			return user;
		})
});
