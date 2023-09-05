/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BookProperties } from '$lib/shared/book';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument } from 'mongoose';
import { Book } from '$lib/models/book';
import type { Session } from '@supabase/supabase-js';
import type { Genre } from '$lib/shared/genre';
import { UsersRepository } from './usersRepository';

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

		if (genres) {
			if (genres.length > 0) {
				filter.genres = { $all: genres };
			}
		} else {
			const userRepo = new UsersRepository();
			const user = await userRepo.getById(session);
			if (user) {
				filter.genres = { $in: user.genres };
			}
		}

		if (cursor) {
			filter._id = { $gt: cursor };
		}

		const query = Book.find(filter, null, {
			userID: session?.user.id,
			limit
		});

		return await query;
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

		return await query;
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
