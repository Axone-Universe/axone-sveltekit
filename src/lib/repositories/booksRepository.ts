/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BookProperties } from '$lib/shared/book';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument } from 'mongoose';
import { Book } from '$lib/models/book';
import type { Session } from '@supabase/supabase-js';
import type { Genre } from '$lib/shared/genre';

export class BooksRepository extends Repository {
	async get(
		session: Session | null,
		limit?: number,
		cursor?: string,
		genres?: Genre[],
		title?: string
	): Promise<HydratedDocument<BookProperties>[]> {
		const filter: any = {};

		if (title) {
			filter.title = title;
		}

		if (genres && genres.length > 0) {
			filter.genres = { $all: genres };
		}

		if (cursor) {
			filter._id = { $gt: cursor };
		}

		const query = Book.find(filter, null, {
			userID: session?.user.id,
			limit
		});

		return (await query) as HydratedDocument<BookProperties>[];
	}

	async getByTitle(
		session: Session | null,
		title?: string,
		limit?: number,
		cursor?: string
	): Promise<HydratedDocument<BookProperties>[]> {
		const filter: any = {};

		if (title) {
			filter.title = title;
		}

		if (cursor) {
			filter._id = { $gt: cursor };
		}

		const query = Book.find(filter, null, {
			userID: session?.user.id,
			limit
		});

		return (await query) as HydratedDocument<BookProperties>[];
	}

	async getById(session: Session | null, id?: string): Promise<HydratedDocument<BookProperties>> {
		const query = Book.findById(id, null, {
			userID: session?.user.id
		});

		return (await query) as HydratedDocument<BookProperties>;
	}

	async count(): Promise<number> {
		return await Book.count();
	}
}
