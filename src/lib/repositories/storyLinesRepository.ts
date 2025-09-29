import { Storyline } from '$lib/models/storyline';
import { Repository } from '$lib/repositories/repository';
import type { StorylineProperties } from '$lib/properties/storyline';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';
import type { ReadStoryline } from '$lib/trpc/schemas/storylines';
import { UsersRepository } from './usersRepository';
import { ulid } from 'ulid';
import type { Context } from '$lib/trpc/context';

export class StorylinesRepository extends Repository {
	constructor() {
		super();
	}

	async get(ctx: Context, input: ReadStoryline): Promise<HydratedDocument<StorylineProperties>[]> {
		const pipeline = [];
		const postPipeline = [];
		const filter: any = {};

		if (input.title) filter.title = { $regex: input.title, $options: 'i' };
		if (input.user) filter.user = input.user;
		if (input.bookID) filter.book = input.bookID;
		if (input.archived !== undefined) filter.archived = input.archived;

		if (input.genres) {
			if (input.genres.length > 0) {
				filter.genres = { $all: input.genres };
			}
		}

		if (input.tags) {
			if (input.tags.includes('Campaigns')) {
				postPipeline.push({
					$match: {
						'book.campaign': { $exists: true },
						main: true
					}
				});
			}

			if (input.tags.includes('Recommended')) {
				const userRepo = new UsersRepository();
				const user = await userRepo.getById(ctx, ctx.session?.user.id);
				if (user && user.genres) {
					filter.genres = { $in: user.genres };
				}
			}

			if (input.tags.includes('Newest')) {
				postPipeline.push({ $sort: { _id: -1 } });
			}

			if (input.tags.includes('Past 30 Days')) {
				const ulid30 = ulid(this.getUnixTimeDaysAgo(30));
				filter._id = { $gt: ulid30 };
			}
		}

		pipeline.push({ $match: filter });

		if (input.cursor) {
			postPipeline.push({ $skip: (input.cursor ?? 0) + (input.skip ?? 0) });
		}

		if (input.limit) postPipeline.push({ $limit: input.limit });

		const query = Storyline.aggregate(pipeline, {
			user: ctx.user,
			postPipeline: postPipeline
		});

		return await query;
	}

	getUnixTimeDaysAgo(days: number): number {
		const currentTime = Date.now();
		const millisecondsInADay = 86400_000;
		const thirtyDaysAgo = currentTime - days * millisecondsInADay;
		return thirtyDaysAgo;
	}

	async getByTitle(
		ctx: Context,
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<StorylineProperties>[]> {
		throw new Error('not Implemented');
	}

	async getById(ctx: Context, id: string): Promise<HydratedDocument<StorylineProperties>> {
		const storyline = await Storyline.aggregate([{ $match: { _id: id } }], {
			user: ctx.user
		})
			.cursor()
			.next();

		return new Promise<HydratedDocument<StorylineProperties>>((resolve) => {
			resolve(storyline);
		});
	}

	async getByIds(ctx: Context, ids: string[]): Promise<HydratedDocument<StorylineProperties>[]> {
		const storylines = await Storyline.aggregate([{ $match: { _id: { $in: ids } } }], {
			user: ctx.user
		});

		return new Promise<HydratedDocument<StorylineProperties>[]>((resolve) => {
			resolve(storylines);
		});
	}

	async getByBookID(
		ctx: Context,
		bookID: string,
		main?: boolean | undefined
	): Promise<HydratedDocument<StorylineProperties>[]> {
		const pipeline = [];

		pipeline.push(main ? { $match: { book: bookID, main: true } } : { $match: { book: bookID } });

		const storylines = await Storyline.aggregate(pipeline, {
			user: ctx.user
		});

		return new Promise<HydratedDocument<StorylineProperties>[]>((resolve) => {
			resolve(storylines);
		});
	}

	async getStorylinesByUserID(
		ctx: Context,
		id?: string
	): Promise<HydratedDocument<StorylineProperties>[]> {
		const pipeline = [];

		pipeline.push({ $match: { user: id, main: true } });

		const storyline = (await Storyline.aggregate(pipeline, {
			user: ctx.user
		})) as HydratedDocument<StorylineProperties>[];
		return new Promise<HydratedDocument<StorylineProperties>[]>((resolve) => {
			resolve(storyline);
		});
	}

	async count(): Promise<number> {
		const count = await Storyline.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
