import { z } from 'zod';

import { BookBuilder } from '$lib/nodes/digital-products/book';
import { BooksRepository } from '$lib/repositories/booksRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { listSchema } from '$lib/util/schemas';

const usersRepo = new BooksRepository();

export const books = t.router({
	list: t.procedure
		.use(logger)
		.input(listSchema.optional())
		.query(async ({ input }) => {
			const result = await usersRepo.get(input?.searchTerm, input?.limit, input?.skip);

			return result;
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(z.string())
		.mutation(async ({ input, ctx }) => {
			assert(ctx.session?.user.id);

			const userAuthoredBook = await new BookBuilder()
				.userID(ctx.session.user.id)
				.title(input)
				.build();

			return userAuthoredBook;
		})
});
