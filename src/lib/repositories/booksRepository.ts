/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BookProperties } from '$lib/properties/book';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument, PipelineStage } from 'mongoose';
import { Book } from '$lib/models/book';
import type { Session } from '@supabase/supabase-js';
import type { Genre } from '$lib/properties/genre';
import { UsersRepository } from './usersRepository';

export class BooksRepository extends Repository {
	async get(
		session: Session | null,
		limit?: number,
		cursor?: string,
		genres?: Genre[],
		title?: string,
		user?: string,
		archived?: boolean,
		campaign?: string | null
	): Promise<HydratedDocument<BookProperties>[]> {
		const pipeline: PipelineStage[] = [];
		const filter: any = {};

		if (title) {
			filter.$text = { $search: title };
		}

		if (user) {
			filter.user = user;
		}

		if (campaign === null) {
			// no campaigns
			filter.campaign = null;
		} else if (campaign === '') {
			// only campaigns
			filter.campaign = { $ne: null };
		} else if (campaign !== undefined) {
			// specific campaign
			filter.campaign = campaign;
		} // else both normal books and campaigns

		if (genres) {
			if (genres.length > 0) {
				filter.genres = { $all: genres };
			}
		}
		// Introduces unexpected behaviour in the method. User genres should be passed through the parameter
		else if (!user) {
			const userRepo = new UsersRepository();
			const user = await userRepo.getById(session, session?.user.id);
			if (user && user.genres) {
				filter.genres = { $in: user.genres };
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
