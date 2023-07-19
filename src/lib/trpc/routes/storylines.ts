import { StorylineBuilder } from '$lib/documents/digital-products/storyline';
import { StorylinesRepository } from '$lib/repositories/storyLinesRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create } from '$lib/trpc/schemas/storylines';
import { search } from '$lib/trpc/schemas/storylines';

const storylinesRepo = new StorylinesRepository();

export const storylines = t.router({
	getAll: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input }) => {
			if (input?.bookID) {
				storylinesRepo.bookId(input.bookID);
			}
			const result = await storylinesRepo.getAll(input?.limit, input?.skip);

			return result;
		}),

	getById: t.procedure
		.use(logger)
		.input(search)
		.query(async ({ input }) => {
			storylinesRepo.bookId(input.bookID);
			const result = await storylinesRepo.getById(input.storylineID);

			return result;
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const storylineBuilder = new StorylineBuilder()
				.userID(ctx.session!.user.id)
				.bookID(input.bookID)
				.title(input.title)
				.description(input.description);

			if (input?.parentStorylineID) storylineBuilder.parentStorylineID(input.parentStorylineID);
			if (input?.branchOffChapterID) storylineBuilder.branchOffChapterID(input.branchOffChapterID);
			if (input?.imageURL) storylineBuilder.imageURL(input.imageURL);

			const storylineNode = await storylineBuilder.build();

			return storylineNode;
		})
});
