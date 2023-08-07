import { BookBuilder } from '$lib/documents/digital-products/book';
import { BooksRepository } from '$lib/repositories/booksRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, submitToCampaign } from '$lib/trpc/schemas/books';
import { search } from '$lib/trpc/schemas/shared';

export const books = t.router({
	getAll: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input, ctx }) => {
			const booksRepo = new BooksRepository();
			const result = await booksRepo.getAll(ctx.session, input?.limit, input?.skip);

			return result;
		}),

	getByTitle: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input, ctx }) => {
			const booksRepo = new BooksRepository();
			const result = await booksRepo.getByTitle(
				ctx.session!,
				input?.searchTerm,
				input?.limit,
				input?.skip
			);

			return result;
		}),

	getById: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input, ctx }) => {
			const booksRepo = new BooksRepository();
			const result = await booksRepo.getById(ctx.session, input?.searchTerm);

			return result;
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
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

			return bookNode;
		}),

	submitToCampaign: t.procedure
		.use(logger)
		.use(auth)
		.input(submitToCampaign) // TODO: use createBook schema
		.mutation(async () => {
			throw new Error('not Implemented');
		})
});
