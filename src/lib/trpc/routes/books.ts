import { BookBuilder } from '$lib/documents/digital-products/book';
import { StorylineBuilder } from '$lib/documents/digital-products/storyline';
import { BooksRepository } from '$lib/repositories/booksRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, submitToCampaign } from '$lib/trpc/schemas/books';
import { search } from '$lib/trpc/schemas/shared';

const booksRepo = new BooksRepository();

export const books = t.router({
	getAll: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input }) => {
			const result = await booksRepo.getAll(input?.limit, input?.skip);

			return result;
		}),

	getByTitle: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input }) => {
			const result = await booksRepo.getByTitle(input?.searchTerm, input?.limit, input?.skip);

			return result;
		}),

	getById: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input }) => {
			const result = await booksRepo.getById(input?.searchTerm);

			return result;
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create) // TODO: use createBook schema
		.mutation(async ({ input, ctx }) => {
			const bookBuilder = new BookBuilder()
				.userID(ctx.session!.user.id)
				.title(input.title)
				.description(input.description)
				.imageURL(input.imageURL);

			if (input.genres) {
				bookBuilder.genres(input.genres);
			}

			const bookNode = await bookBuilder.build();

			// Also create the default/main storyline
			const storylineBuilder = new StorylineBuilder()
				.userID(ctx.session!.user.id)
				.bookID(bookNode._id)
				.title(input.title)
				.main(true)
				.description(input.description)
				.imageURL(input.imageURL);

			await storylineBuilder.build();

			return bookNode;
		}),

	submitToCampaign: t.procedure
		.use(logger)
		.use(auth)
		.input(submitToCampaign) // TODO: use createBook schema
		.mutation(async ({ input }) => {
			throw new Error('not Implemented');
		})
});
