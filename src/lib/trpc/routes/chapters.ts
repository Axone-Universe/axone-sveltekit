import { ChapterBuilder } from '$lib/documents/digital-products/chapter';
import { ChaptersRepository } from '$lib/repositories/chaptersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, update } from '$lib/trpc/schemas/chapters';
import { search } from '$lib/trpc/schemas/chapters';
import type { HydratedDocument } from 'mongoose';
import type { PermissionProperties } from '$lib/shared/permission';

export const chapters = t.router({
	getAll: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input, ctx }) => {
			const chaptersRepo = new ChaptersRepository();

			if (input?.storylineID) {
				chaptersRepo.storylineID(input.storylineID);
			}

			if (input?.toChapterID) {
				chaptersRepo.toChapterID(input.toChapterID);
			}

			const result = await chaptersRepo.getAll(ctx.session, input?.limit, input?.skip);

			return result;
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const chapterBuilder = new ChapterBuilder(input.id).sessionUserID(ctx.session!.user.id);

			if (input?.description) {
				chapterBuilder.description(input.description);
			}

			if (input?.title) {
				chapterBuilder.title(input.title);
			}

			if (input?.permissions) {
				chapterBuilder.permissions(input.permissions as any);
			}

			const chapterNode = await chapterBuilder.update();
			return chapterNode;
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const chapterBuilder = new ChapterBuilder()
				.sessionUserID(ctx.session!.user.id)
				.userID(ctx.session!.user.id)
				.title(input.title)
				.bookID(input.bookID)
				.storylineID(input.storylineID)
				.description(input.description);

			if (input?.prevChapterID) {
				chapterBuilder.prevChapterID(input.prevChapterID);
			}

			if (input?.permissions) {
				chapterBuilder.permissions(input.permissions as any);
			}

			const chapterNode = await chapterBuilder.build();

			return chapterNode;
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const chapterBuilder = new ChapterBuilder(input.id).sessionUserID(ctx.session!.user.id);
			const response = await chapterBuilder.delete();
			return response;
		})
});
