import { BookBuilder } from '$lib/documents/digital-products/book';
import { BooksRepository } from '$lib/repositories/booksRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, read, update } from '$lib/trpc/schemas/books';
import { sendUserNotifications } from '$lib/util/notifications/novu';
import { setArchived } from '../schemas/shared';

export const books = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const booksRepo = new BooksRepository();

			const result = await booksRepo.get(
				ctx.session,
				input.limit,
				input.cursor,
				input.genres,
				input.title,
				input.user,
				input.archived
			);

			return { result, cursor: result.length > 0 ? result[result.length - 1]._id : undefined };
		}),

	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const booksRepo = new BooksRepository();
			const result = await booksRepo.getById(ctx.session, input.id);

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
			if (input.imageURL !== undefined) bookBuilder.imageURL(input.imageURL);
			if (input.genres) bookBuilder.genres(input.genres);
			if (input.permissions) bookBuilder.permissions(input.permissions as any);

			const book = await bookBuilder.update();

			if (input.notifications) {
				sendUserNotifications(input.notifications);
			}

			return book;
		}),

	setArchived: t.procedure
		.use(logger)
		.use(auth)
		.input(setArchived)
		.mutation(async ({ input, ctx }) => {
			const bookBuilder = new BookBuilder()
				.sessionUserID(ctx.session!.user.id)
				.userID(ctx.session!.user.id)
				.archived(input.archived);

			const acknowledged = await bookBuilder.setArchived(input.ids);

			return acknowledged;
		}),

	getBooksByUserID: t.procedure
		.use(logger)
		.input(read.optional())
		.query(async ({ input, ctx }) => {
			const booksRepo = new BooksRepository();
			const result = await booksRepo.getBooksByUserID(ctx.session, input?.id);

			return result;
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

			if (input.permissions) bookBuilder.permissions(input.permissions as any);
			if (input.genres) bookBuilder.genres(input.genres);

			const book = await bookBuilder.build();

			if (input.notifications) {
				sendUserNotifications(input.notifications);
			}

			return book;
		}),

	submitToCampaign: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async () => {
			throw new Error('not Implemented');
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const bookBuilder = new BookBuilder(input.id).sessionUserID(ctx.session!.user.id);
			const response = await bookBuilder.delete();
			return response;
		})
});
