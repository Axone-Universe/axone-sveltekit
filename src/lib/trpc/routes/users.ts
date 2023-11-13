import { UserBuilder } from '$lib/documents/user';
import { UsersRepository } from '$lib/repositories/usersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import type { Response } from '$lib/util/types';

import {
	create,
	createDeleteReadingList,
	read,
	getReadingList,
	update,
	updateReadingLists,
	renameReadingList
} from '$lib/trpc/schemas/users';
import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from '$lib/properties/user';

export const users = t.router({
	list: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();

			const response: Response = {
				success: true,
				message: 'users successfully retrieved',
				data: {}
			};
			try {
				const result = await usersRepo.get(ctx.session, input.id);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties>[] } };
		}),

	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();

			const response: Response = {
				success: true,
				message: 'user successfully retrieved',
				data: {}
			};
			try {
				const result = await usersRepo.getById(ctx.session, input.id);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),

	getByDetails: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();

			const response: Response = {
				success: true,
				message: 'user successfully retrieved',
				data: {}
			};
			try {
				const result = await usersRepo.getByDetails(ctx.session, input.detail ?? '');
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties>[] } };
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

			const response: Response = {
				success: true,
				message: 'update successfull',
				data: {}
			};
			try {
				const result = await userBuilder.update();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
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

			const response: Response = {
				success: true,
				message: 'user successfully created',
				data: {}
			};
			try {
				const result = await userBuilder.build();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> } };
		}),

	getReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(getReadingList)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();

			const response: Response = {
				success: true,
				message: 'reading list retrieved',
				data: {}
			};
			try {
				const result = await usersRepo.getReadingList(ctx.session!.user.id, input.name);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as any[] } };
		}),

	createReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(createDeleteReadingList)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'reading list created',
				data: {}
			};

			try {
				const result = await new UserBuilder(ctx.session!.user.id).createReadingList(input);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),

	deleteReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(createDeleteReadingList)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'reading list deleted',
				data: {}
			};

			try {
				const result = await new UserBuilder(ctx.session!.user.id).deleteReadingList(input);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),

	renameReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(renameReadingList)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'reading list renamed',
				data: {}
			};

			try {
				const result = await new UserBuilder(ctx.session!.user.id).renameReadingList(input);

				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),

	updateReadingLists: t.procedure
		.use(logger)
		.use(auth)
		.input(updateReadingLists)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'reading list updated',
				data: {}
			};

			try {
				const result = await new UserBuilder(ctx.session!.user.id).updateReadingLists(input);

				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		})
});
