import type { BookProperties } from '$lib/shared/book';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument } from 'mongoose';
import { Book } from '$lib/models/book';

export class BooksRepository extends Repository {
	async getAll(limit?: number, skip?: number): Promise<HydratedDocument<BookProperties>[]> {
		let query = Book.find();

		if (skip) {
			query = query.skip(skip);
		}

		if (limit) {
			query = query.limit(limit);
		}

		const books = (await query) as HydratedDocument<BookProperties>[];
		return new Promise<HydratedDocument<BookProperties>[]>((resolve) => {
			resolve(books);
		});
	}

	async getByTitle(
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<BookProperties>[]> {
		let query = Book.find({ title: title });

		if (skip) {
			query = query.skip(skip);
		}

		if (limit) {
			query = query.limit(limit);
		}

		const books = await query;

		return new Promise<HydratedDocument<BookProperties>[]>((resolve) => {
			resolve(books);
		});
	}

	async getById(id?: string): Promise<HydratedDocument<BookProperties>> {
		const book = await Book.findById(id);

		return new Promise<HydratedDocument<BookProperties>>((resolve) => {
			resolve(book);
		});
	}

	async count(): Promise<number> {
		const count = await Book.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
