import { BookBuilder } from '$lib/documents/digital-products/book';
import { BooksRepository } from '$lib/repositories/booksRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { addStoryline, create, read, update } from '$lib/trpc/schemas/books';
import { sendNotifications, sendUserNotifications } from '$lib/util/notifications/novu';
import { setArchived } from '../schemas/shared';
import type { Response } from '$lib/util/types';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import type mongoose from 'mongoose';

export const books = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const booksRepo = new BooksRepository();

			const response: Response = { success: true, message: 'books retrieved', data: {} };
			try {
				const result = await booksRepo.get(ctx.session, input);
				response.data = result;
				response.cursor = result.length > 0 ? (input.cursor ?? 0) + result.length : undefined;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<BookProperties>[] } };
		}),

	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const booksRepo = new BooksRepository();

			const response: Response = { success: true, message: 'book retrieved', data: {} };
			try {
				const result = await booksRepo.getById(ctx.session, input.id);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<BookProperties> } };
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
			if (input.tags) bookBuilder.tags(input.tags);
			if (input.permissions) bookBuilder.permissions(input.permissions as any);

			const response: Response = { success: true, message: 'book updated', data: {} };
			try {
				const book = await bookBuilder.update();

				if (input.notifications) {
					sendNotifications(input.notifications);
				}
				response.data = book;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<BookProperties> } };
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

			const response: Response = { success: true, message: 'book archived', data: {} };
			try {
				await bookBuilder.setArchived(input.ids);
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return response;
		}),

	getBooksByUserID: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const booksRepo = new BooksRepository();

			const response: Response = { success: true, message: 'book returned', data: {} };
			try {
				const result = await booksRepo.getBooksByUserID(ctx.session, input?.id);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<BookProperties>[] } };
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
				.description(input.description);

			if (input.permissions) bookBuilder.permissions(input.permissions as any);
			if (input.genres) bookBuilder.genres(input.genres);
			if (input.imageURL) bookBuilder.imageURL(input.imageURL);
			if (input.tags) bookBuilder.tags(input.tags);

			const response: Response = {
				success: true,
				message: 'book successfully created',
				data: '' as string
			};
			try {
				const book = await bookBuilder.build();

				if (input.notifications) {
					sendNotifications(input.notifications);
				}
				response.data = book;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<BookProperties> } };
		}),
	addStoryline: t.procedure
		.use(logger)
		.use(auth)
		.input(addStoryline)
		.mutation(async ({ input, ctx }) => {
			const bookBuilder = new BookBuilder(input.bookID).sessionUserID(ctx.session!.user.id);

			const response: Response = {
				success: true,
				message: 'storyline successfully added',
				data: {}
			};
			try {
				const result = await bookBuilder.addStoryline(input.storylineID);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data } };
		}),
	removeStoryline: t.procedure
		.use(logger)
		.use(auth)
		.input(addStoryline)
		.mutation(async ({ input, ctx }) => {
			const bookBuilder = new BookBuilder(input.bookID).sessionUserID(ctx.session!.user.id);

			const response: Response = {
				success: true,
				message: 'Storyline successfully removed',
				data: {}
			};
			try {
				const result = await bookBuilder.removeStoryline(input.storylineID);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data } };
		}),
	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const bookBuilder = new BookBuilder(input.id).sessionUserID(ctx.session!.user.id);

			const response: Response = { success: true, message: 'book successfully deleted', data: {} };
			try {
				const result = await bookBuilder.delete();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as mongoose.mongo.DeleteResult } };
		})
});
