import type { BookProperties } from '$lib/shared/book';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument } from 'mongoose';
import { Book } from '$lib/models/book';
import type { Session } from '@supabase/supabase-js';

export class BooksRepository extends Repository {
	async getAll(
		session: Session | null,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<BookProperties>[]> {
		const pipeline = [];

		pipeline.push({ $match: {} });
		if (limit) pipeline.push({ $limit: limit });
		if (skip) pipeline.push({ $skip: skip });

		const books = (await Book.aggregate(pipeline, {
			userID: session?.user.id
		})) as HydratedDocument<BookProperties>[];

		return new Promise<HydratedDocument<BookProperties>[]>((resolve) => {
			resolve(books);
		});
	}

	async getByTitle(
		session: Session | null,
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<BookProperties>[]> {
		const pipeline = [];

		pipeline.push({ $match: { title: title } });
		if (limit) pipeline.push({ $limit: limit });
		if (skip) pipeline.push({ $skip: skip });

		const books = (await Book.aggregate(pipeline, {
			userID: session?.user.id
		})) as HydratedDocument<BookProperties>[];

		return new Promise<HydratedDocument<BookProperties>[]>((resolve) => {
			resolve(books);
		});
	}

	async getById(session: Session | null, id?: string): Promise<HydratedDocument<BookProperties>> {
		const book = await Book.aggregate([{ $match: { _id: id } }], {
			userID: session?.user.id
		})
			.cursor()
			.next();

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
