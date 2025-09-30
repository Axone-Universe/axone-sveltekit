/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BookProperties } from '$lib/properties/book';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument, PipelineStage } from 'mongoose';
import { Book } from '$lib/models/book';
import type { Session } from '@supabase/supabase-js';
import { UsersRepository } from './usersRepository';
import { ReadBook } from '$lib/trpc/schemas/books';
import type { Context } from '$lib/trpc/context';

export class BooksRepository extends Repository {
	async get(ctx: Context, input: ReadBook): Promise<HydratedDocument<BookProperties>[]> {
		const pipeline: PipelineStage[] = [];
		const filter: any = {};

		if (input.title) {
			filter.$text = { $search: input.title };
		}

		if (input.user) {
			filter.user = input.user;
		}

		if (input.genres) {
			if (input.genres.length > 0) {
				filter.genres = { $all: input.genres };
			}
		}

		if (input.tags) {
			if (input.tags.includes('Campaigns')) {
				filter.campaign = { $ne: null };
			}

			if (input.tags.includes('Books')) {
				filter.campaign = { $eq: null };
			}

			if (input.tags.includes('Recommended')) {
				const userRepo = new UsersRepository();
				const user = await userRepo.getById(ctx, ctx.session?.user.id);
				if (user && user.genres) {
					filter.genres = { $in: user.genres };
				}
			}
		}

		if (input.archived !== undefined) {
			filter.archived = input.archived;
		}

		pipeline.push({ $match: filter });

		if (input.cursor) {
			pipeline.push({ $skip: (input.cursor ?? 0) + (input.skip ?? 0) });
		}

		if (input.title) {
			pipeline.push({ $sort: { score: { $meta: 'textScore' } } });
		}

		if (input.limit) pipeline.push({ $limit: input.limit });

		const query = Book.aggregate(pipeline, {
			user: ctx.user
		});

		return await query;
	}

	async getById(ctx: Context, id?: string): Promise<HydratedDocument<BookProperties>> {
		const query = Book.aggregate([{ $match: { _id: id } }], {
			user: ctx.user
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
