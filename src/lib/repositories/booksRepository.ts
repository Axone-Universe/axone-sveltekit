/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BookProperties } from '$lib/properties/book';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument, PipelineStage } from 'mongoose';
import { Book } from '$lib/models/book';
import type { Session } from '@supabase/supabase-js';
import type { Genre } from '$lib/properties/genre';
import { UsersRepository } from './usersRepository';
import type { HomeFilterTag } from '$lib/util/types';

export class BooksRepository extends Repository {
	async get(
		session: Session | null,
		limit?: number,
		cursor?: string,
		genres?: Genre[],
		tags?: HomeFilterTag[],
		title?: string,
		user?: string,
		archived?: boolean
	): Promise<HydratedDocument<BookProperties>[]> {
		const pipeline: PipelineStage[] = [];
		const filter: any = {};

		if (title) {
			filter.$text = { $search: title };
		}

		if (user) {
			filter.user = user;
		}

		if (genres) {
			if (genres.length > 0) {
				filter.genres = { $all: genres };
			}
		}

		if (tags) {
			if (tags.includes('Campaigns')) {
				filter.campaign = { $ne: null };
			}

			if (tags.includes('Recommended')) {
				const userRepo = new UsersRepository();
				const user = await userRepo.getById(session, session?.user.id);
				if (user && user.genres) {
					filter.genres = { $in: user.genres };
				}
			}
		}

		if (archived !== undefined) {
			filter.archived = archived;
		}

		if (cursor) {
			filter._id = { $gt: cursor };
		}

		pipeline.push({ $match: filter });

		if (title) {
			pipeline.push({ $sort: { score: { $meta: 'textScore' } } });
		}

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

	async getBooksByUserID(
		session: Session | null,
		id?: string,
		limit?: number,
		cursor?: string
	): Promise<HydratedDocument<BookProperties>[]> {
		const pipeline = [];
		const filter: any = {};

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

		if (cursor) {
			filter._id = { $gt: cursor };
		}

		if (limit) pipeline.push({ $limit: limit });

		const books = (await Book.aggregate(pipeline, {
			userID: session?.user.id
		})) as HydratedDocument<BookProperties>[];

		return new Promise<HydratedDocument<BookProperties>[]>((resolve) => {
			resolve(books);
		});
	}
}
