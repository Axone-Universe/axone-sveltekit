import { StorylineBuilder } from '$lib/documents/digital-products/storyline';
import { StorylinesRepository } from '$lib/repositories/storyLinesRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, read, update } from '$lib/trpc/schemas/storylines';
import { sendUserNotifications } from '$lib/util/notifications/novu';
import { setArchived } from '../schemas/shared';
import type { Response } from '$lib/util/types';
import type { HydratedDocument } from 'mongoose';
import type { StorylineProperties } from '$lib/properties/storyline';
import type mongoose from 'mongoose';

export const storylines = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const storylinesRepo = new StorylinesRepository();

			const response: Response = {
				success: true,
				message: 'storylines successfully retrieved',
				data: {}
			};
			try {
				const result = await storylinesRepo.get(ctx.session, input);
				response.data = result;
				response.cursor = result.length > 0 ? result[result.length - 1]._id : undefined;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<StorylineProperties>[] } };
		}),

	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const storylinesRepo = new StorylinesRepository();

			const response: Response = {
				success: true,
				message: 'storyline successfully retrieved',
				data: {}
			};
			try {
				const result = await storylinesRepo.getById(ctx.session, input.storylineID!);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<StorylineProperties> } };
		}),

	getByBookID: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const storylinesRepo = new StorylinesRepository();

			const response: Response = {
				success: true,
				message: 'storylines successfully retrieved',
				data: {}
			};
			try {
				const result = await storylinesRepo.getByBookID(ctx.session, input.bookID!, input.main);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<StorylineProperties>[] } };
		}),

	getStorylinesByUserID: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const storylinesRepo = new StorylinesRepository();

			const response: Response = {
				success: true,
				message: 'storylines successfully retrieved',
				data: {}
			};
			try {
				const result = await storylinesRepo.getStorylinesByUserID(ctx.session, input?.searchTerm);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<StorylineProperties>[] } };
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const storylineBuilder = new StorylineBuilder(input.id).sessionUserID(ctx.session!.user.id);

			if (input.description) storylineBuilder.description(input.description);
			if (input.title) storylineBuilder.title(input.title);
			if (input.permissions) storylineBuilder.permissions(input.permissions as any);
			if (input.imageURL !== undefined) storylineBuilder.imageURL(input.imageURL);

			const response: Response = {
				success: true,
				message: 'storylines successfully retrieved',
				data: {}
			};
			try {
				const result = await storylineBuilder.update();

				if (input.notifications) {
					sendUserNotifications(input.notifications);
				}
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<StorylineProperties> } };
		}),

	setArchived: t.procedure
		.use(logger)
		.use(auth)
		.input(setArchived)
		.mutation(async ({ input, ctx }) => {
			const storylineBuilder = new StorylineBuilder()
				.sessionUserID(ctx.session!.user.id)
				.userID(ctx.session!.user.id)
				.archived(input.archived);

			const response: Response = {
				success: true,
				message: 'storylines successfully retrieved',
				data: {}
			};
			try {
				const result = await storylineBuilder.setArchived(input.ids);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as boolean } };
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const storylineBuilder = new StorylineBuilder().userID(ctx.session!.user.id);

			if (input?.book) storylineBuilder.bookID(input.book as string);
			if (input?.title) storylineBuilder.title(input.title);
			if (input?.description) storylineBuilder.description(input.description);
			if (input?.parent) storylineBuilder.parentStorylineID(input.parent);
			if (input?.parentChapter) storylineBuilder.branchOffChapterID(input.parentChapter);
			if (input?.imageURL) storylineBuilder.imageURL(input.imageURL);

			if (input?.permissions) {
				storylineBuilder.permissions(input.permissions as any);
			}

			const response: Response = {
				success: true,
				message: 'storylines successfully created',
				data: {}
			};
			try {
				const result = await storylineBuilder.build();

				if (input.notifications) {
					await sendUserNotifications(input.notifications);
				}
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<StorylineProperties> } };
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const storylineBuilder = new StorylineBuilder(input.id).sessionUserID(ctx.session!.user.id);

			const response: Response = {
				success: true,
				message: 'storyline successfully deleted',
				data: {}
			};
			try {
				const result = await storylineBuilder.delete();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as mongoose.mongo.DeleteResult } };
		})
});
