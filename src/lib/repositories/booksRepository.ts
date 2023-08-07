import type { BookProperties } from '$lib/shared/book';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument } from 'mongoose';
import { Book } from '$lib/models/book';
import type { Session } from '@supabase/supabase-js';

export class BooksRepository extends Repository {
	async getAll(
		session: Session,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<BookProperties>[]> {
		let query = Book.find({}, null, { userID: session?.user.id });

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
		session: Session,
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<BookProperties>[]> {
		let query = Book.find({ title: title }, null, { userID: session?.user.id });

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

	async getById(session: Session, id?: string): Promise<HydratedDocument<BookProperties>> {
		const book = await Book.findById(id, null, { userID: session?.user.id });

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
