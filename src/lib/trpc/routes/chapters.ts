import { ChapterBuilder } from '$lib/documents/digital-products/chapter';
import { ChaptersRepository } from '$lib/repositories/chaptersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, update } from '$lib/trpc/schemas/chapters';
import { search } from '$lib/trpc/schemas/chapters';

export const chapters = t.router({
	getAll: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input }) => {
			const chaptersRepo = new ChaptersRepository();

			if (input?.storylineID) {
				chaptersRepo.storylineID(input.storylineID);
			}

			if (input?.toChapterID) {
				chaptersRepo.toChapterID(input.toChapterID);
			}

			const result = await chaptersRepo.getAll(input?.limit, input?.skip);

			return result;
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input }) => {
			const chapterBuilder = new ChapterBuilder(input.id);

			if (input?.description) {
				chapterBuilder.description(input.description);
			}

			if (input?.title) {
				chapterBuilder.title(input.title);
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
				.userID(ctx.session!.user.id)
				.title(input.title)
				.bookID(input.bookID)
				.storylineID(input.storylineID)
				.description(input.description);

			if (input?.prevChapterID) {
				chapterBuilder.prevChapterID(input.prevChapterID);
			}

			const chapterNode = await chapterBuilder.build();

			return chapterNode;
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input }) => {
			const chapterBuilder = new ChapterBuilder(input.id);
			const response = await chapterBuilder.delete();
			return response;
		})
});
