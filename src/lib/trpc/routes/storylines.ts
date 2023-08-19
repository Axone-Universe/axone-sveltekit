import { StorylineBuilder } from '$lib/documents/digital-products/storyline';
import { StorylinesRepository } from '$lib/repositories/storyLinesRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create } from '$lib/trpc/schemas/storylines';
import { search } from '$lib/trpc/schemas/storylines';
import type { HydratedDocument } from 'mongoose';
import type { PermissionProperties } from '$lib/shared/permission';

const storylinesRepo = new StorylinesRepository();

export const storylines = t.router({
	getAll: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input, ctx }) => {
			if (input?.bookID) {
				storylinesRepo.bookId(input.bookID);
			}
			const result = await storylinesRepo.getAll(ctx.session, input?.limit, input?.skip);

			return result;
		}),

	getById: t.procedure
		.use(logger)
		.input(search)
		.query(async ({ input, ctx }) => {
			storylinesRepo.bookId(input.bookID);
			const result = await storylinesRepo.getById(ctx.session, input.storylineID);

			return result;
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

			const storylineNode = await storylineBuilder.build();

			return storylineNode;
		})
});
