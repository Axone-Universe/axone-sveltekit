import { BookBuilder } from '$lib/documents/digital-products/book';
import { BooksRepository } from '$lib/repositories/booksRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, submitToCampaign, update } from '$lib/trpc/schemas/books';
import { search } from '$lib/trpc/schemas/shared';
import type { HydratedDocument } from 'mongoose';
import type { PermissionProperties } from '$lib/shared/permission';

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
	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const bookBuilder = new BookBuilder(input.id)
				.sessionUserID(ctx.session!.user.id)
				.userID(ctx.session!.user.id);

			if (input.title) bookBuilder.title(input.title);
			if (input.description) bookBuilder.description(input.description);
			if (input.imageURL) bookBuilder.imageURL(input.imageURL);
			if (input.genres) bookBuilder.genres(input.genres);
			if (input.permissions) bookBuilder.permissions(input.permissions as any);

			const bookNode = await bookBuilder.update();
			return bookNode;
		}),
	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const bookBuilder = new BookBuilder()
				.sessionUserID(ctx.session!.user.id)
				.userID(ctx.session!.user.id)
				.title(input.title)
				.description(input.description)
				.imageURL(input.imageURL);

			if (input?.permissions) {
				bookBuilder.permissions(input.permissions as any);
			}

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
