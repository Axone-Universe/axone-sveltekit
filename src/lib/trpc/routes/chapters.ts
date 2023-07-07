import { z } from 'zod';

import { ChapterBuilder } from '$lib/nodes/digital-products/chapter';
import { ChaptersRepository } from '$lib/repositories/chaptersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, update } from '$lib/trpc/schemas/chapters';
import { search } from '$lib/trpc/schemas/chapters';

const chaptersRepo = new ChaptersRepository();

export const chapters = t.router({
	getAll: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input }) => {
			if (input?.storylineID) {
				chaptersRepo.storylineID(input.storylineID);
			}
			const result = await chaptersRepo.getAll(input?.limit, input?.skip);

			return result;
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input }) => {
			const chapterBuilder = new ChapterBuilder().id(input.id);

			if (input?.description) {
				chapterBuilder.description(input.description);
			}

			if (input?.title) {
				chapterBuilder.title(input.title);
			}

			const chapterNode = chapterBuilder.update();
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

			const bookNode = await chapterBuilder.build();

			return bookNode;
		})
});
