import { z } from 'zod';

import { BookBuilder, type BookSubmittedToCampaignResponse } from '$lib/nodes/digital-products/book';
import { BooksRepository } from '$lib/repositories/booksRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { createBookSchema, listSchema, submitToCampaignSchema } from '$lib/trpc/schemas';
import { DBSession } from '$lib/db/session';

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
		.input(createBookSchema) // TODO: use createBook schema
		.mutation(async ({ input, ctx }) => {
			assert(ctx.session?.user.id);

			const userAuthoredBook = await new BookBuilder()
				.userID(ctx.session.user.id)
				.title(input.title)
				.frontCoverURL(input.frontCoverURL)
				.build();

			return userAuthoredBook;
		}),

	submitToCampaign: t.procedure
		.use(logger)
		.use(auth)
		.input(submitToCampaignSchema) // TODO: use createBook schema
		.mutation(async ({ input, ctx }) => {
			assert(ctx.session?.user.id);

			const query = `
				MATCH (book:Book) WHERE book.id='${input.bookID}'
				MATCH (campaign:Campaign) WHERE campaign.id='${input.campaignID}'
				MERGE (book)-[submittedTo:SUBMITTED_TO]->(campaign)
				RETURN book, submittedTo, campaign
			`;

			const session = new DBSession();
			const result = await session.executeWrite<BookSubmittedToCampaignResponse>(query);

			// TODO: fixup or move query to own class
			return result
		})
});
