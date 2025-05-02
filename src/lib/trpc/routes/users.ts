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
import { createNotificationSubscriber, subscribeToTopic } from '$lib/util/notifications/novu';

export const users = t.router({
	get: t.procedure
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
				const result = await usersRepo.get(ctx.session, input);
				response.data = result;
				response.cursor = result.length > 0 ? (input.cursor ?? 0) + result.length : undefined;
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
	getByIds: t.procedure
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
				const result = await usersRepo.getByIds(ctx.session, input.ids);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return {
				...response,
				...{ data: response.data as HydratedDocument<UserProperties>[] | null }
			};
		}),
	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			let userBuilder = new UserBuilder(ctx.session!.user.id).sessionUserID(ctx.session!.user.id);

			if (input.firstName) userBuilder = userBuilder.firstName(input.firstName);
			if (input.lastName) userBuilder = userBuilder.lastName(input.lastName);

			if (input.imageURL) userBuilder = userBuilder.imageURL(input.imageURL);
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

			if (input.imageURL) userBuilder = userBuilder.imageURL(input.imageURL);
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
				createNotificationSubscriber(result);
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
				const result = await new UserBuilder(ctx.session!.user.id)
					.sessionUserID(ctx.session!.user.id)
					.createReadingList(input);
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
				const result = await new UserBuilder(ctx.session!.user.id)
					.sessionUserID(ctx.session!.user.id)
					.deleteReadingList(input);
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
				const result = await new UserBuilder(ctx.session!.user.id)
					.sessionUserID(ctx.session!.user.id)
					.renameReadingList(input);
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
				const result = await new UserBuilder(ctx.session!.user.id)
					.sessionUserID(ctx.session!.user.id)
					.updateReadingLists(input);

				if (input.storylineID) {
					subscribeToTopic(input.storylineID, ctx.session!.user.id);
				}
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		})
});
