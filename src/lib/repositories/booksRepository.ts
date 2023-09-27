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
		const pipeline = [];
		const filter: any = {};

		if (title) {
			filter.title = title;
		}

		if (genres) {
			if (genres.length > 0) {
				filter.genres = { $all: genres };
			}
		}
		// Introduces unexpected behaviour in the method. User genres should be passed through the parameter
		else {
			const userRepo = new UsersRepository();
			const user = await userRepo.getById(session, session?.user.id);
			if (user && user.genres) {
				filter.genres = { $in: user.genres };
			}
		}

		if (cursor) {
			filter._id = { $gt: cursor };
		}

		pipeline.push({ $match: filter });

		if (limit) pipeline.push({ $limit: limit });

		const query = Book.aggregate(pipeline, {
			userID: session?.user.id
		});

		return await query;
	}

	async getById(session: Session | null, id?: string): Promise<HydratedDocument<BookProperties>> {
		const query = Book.aggregate([{ $match: { _id: id } }], {
			userID: session?.user.id
		})
			.cursor()
			.next();

		return await query;
	}

	async count(): Promise<number> {
		return await Book.count();
	}
	/*async getBooksByUserID(session: Session | null, id?: string): Promise<HydratedDocument<BookProperties>[]> {
		//const user = await User.findOne({ userID: session?.user.id }); // Find the user by userID
		const books = await Book.find({ user: id}, null, { userID: session?.user.id }); // Find books by the user's _id


		return new Promise<HydratedDocument<BookProperties>[]>((resolve) => {
			resolve(books);
		});
	}*/

	async getBooksByUserID(
		session: Session | null,
		id?: string
	): Promise<HydratedDocument<BookProperties>[]> {
		const pipeline = [];

		pipeline.push(
			{ $match: { user: id } },
			{
				$lookup: {
					from: 'storylines',

					localField: '_id',

					foreignField: 'book',

					as: 'storylines'
				}
			},

			{
				$addFields: {
					count: { $size: '$storylines' }
				}
			}
		);
		// If you want to limit or skip, you can add those stages here
		// if (limit) pipeline.push({ $limit: limit });
		// if (skip) pipeline.push({ $skip: skip });

		const books = (await Book.aggregate(pipeline, {
			userID: session?.user.id
		})) as HydratedDocument<BookProperties>[];

		return new Promise<HydratedDocument<BookProperties>[]>((resolve) => {
			resolve(books);
		});
	}
}
