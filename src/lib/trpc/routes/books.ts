import { z } from 'zod';

import {
	BookBuilder,
	type BookSubmittedToCampaignResponse
} from '$lib/nodes/digital-products/book';
import { StorylineBuilder } from '$lib/nodes/digital-products/storyline';
import { BooksRepository } from '$lib/repositories/booksRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, submitToCampaign } from '$lib/trpc/schemas/books';
import { search } from '$lib/trpc/schemas/shared';
import { DBSession } from '$lib/db/session';
import type { Genres } from '$lib/util/types';

const usersRepo = new BooksRepository();

export const books = t.router({
	getAll: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input }) => {
			const result = await usersRepo.getAll(input?.limit, input?.skip);

			return result;
		}),

	getByTitle: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input }) => {
			const result = await usersRepo.getByTitle(input?.searchTerm, input?.limit, input?.skip);

			return result;
		}),

	getById: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input }) => {
			const result = await usersRepo.getById(input?.searchTerm);

			return result;
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create) // TODO: use createBook schema
		.mutation(async ({ input, ctx }) => {
			assert(ctx.session?.user.id);

			let bookBuilder = new BookBuilder()
				.userID(ctx.session.user.id)
				.title(input.title)
				.description(input.description)
				.imageURL(input.imageURL);

			if (input.genres) {
				const genres = Object.keys(input.genres).filter(
					(key) => (input.genres as Genres)[key as keyof Genres]
				);
				if (genres.length > 0) bookBuilder = bookBuilder.genres(genres);
			}

			const bookNode = await bookBuilder.build();

			// Also create the default/main storyline
			const storylineBuilder = new StorylineBuilder()
				.userID(ctx.session.user.id)
				.bookID(bookNode.book.properties.id)
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
			return result;
		})
});
