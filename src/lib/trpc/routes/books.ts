import { z } from 'zod';

import { Book } from '$lib/nodes/digital-products/Book';
import { BooksRepository } from '$lib/repositories/BooksRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';

export const books = t.router({
	list: t.procedure
		.use(logger)
		.input(z.string().optional())
		.query(async ({ input }) => {
			const usersRepo = new BooksRepository();

			const result = await usersRepo.getBooks(input);

			return result;
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(z.string())
		.query(async ({ input, ctx }) => {
			assert(ctx.session?.user.id);
			const book = new Book(
				{
					title: input
				},
				ctx.session?.user.id
			);

			const result = await book.create<Book>();

			return {
				book: result.records[0].get('properties'),
				creator: result.records[0].get('creator')
			};
		})
});
