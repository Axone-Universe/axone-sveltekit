import { StorylineBuilder } from '$lib/documents/digital-products/storyline';
import { StorylinesRepository } from '$lib/repositories/storyLinesRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, read, update } from '$lib/trpc/schemas/storylines';
import { sendUserNotifications } from '$lib/util/notifications/novu';
import { setArchived } from '../schemas/shared';

export const storylines = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const storylinesRepo = new StorylinesRepository();
			const result = await storylinesRepo.get(ctx.session, input);

			return { result, cursor: result.length > 0 ? result[result.length - 1]._id : undefined };
		}),

	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const storylinesRepo = new StorylinesRepository();
			const result = await storylinesRepo.getById(ctx.session, input.storylineID!);

			return result;
		}),

	getByBookID: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const storylinesRepo = new StorylinesRepository();
			const result = await storylinesRepo.getByBookID(ctx.session, input.bookID!, input.main);

			return result;
		}),

	getStorylinesByUserID: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const storylinesRepo = new StorylinesRepository();
			const result = await storylinesRepo.getStorylinesByUserID(ctx.session, input?.searchTerm);

			return result;
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

			const storyline = await storylineBuilder.update();

			if (input.notifications) {
				sendUserNotifications(input.notifications);
			}

			return storyline;
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

			const acknowledged = await storylineBuilder.setArchived(input.ids);

			return acknowledged;
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

			const storyline = await storylineBuilder.build();

			if (input.notifications) {
				await sendUserNotifications(input.notifications);
			}

			return storyline;
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const storylineBuilder = new StorylineBuilder(input.id).sessionUserID(ctx.session!.user.id);
			const response = await storylineBuilder.delete();
			return response;
		})
});
