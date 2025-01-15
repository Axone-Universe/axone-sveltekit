import { Storyline } from '$lib/models/storyline';
import { Repository } from '$lib/repositories/repository';
import type { StorylineProperties } from '$lib/properties/storyline';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';
import type { ReadStoryline } from '$lib/trpc/schemas/storylines';
import { UsersRepository } from './usersRepository';
import { ulid } from 'ulid';

export class StorylinesRepository extends Repository {
	constructor() {
		super();
	}

	async get(
		session: Session | null,
		input: ReadStoryline
	): Promise<HydratedDocument<StorylineProperties>[]> {
		const pipeline = [];
		const postPipeline = [];
		const filter: any = {};

		if (input.title) filter.$text = { $search: input.title };
		if (input.user) filter.user = input.user;
		if (input.bookID) filter.book = input.bookID;
		if (input.cursor) filter._id = { $gt: input.cursor };
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
						'book.campaign': { $exists: true }
					}
				});
			}

			if (input.tags.includes('Recommended')) {
				const userRepo = new UsersRepository();
				const user = await userRepo.getById(session, session?.user.id);
				if (user && user.genres) {
					filter.genres = { $in: user.genres };
				}
			}

			if (input.tags.includes('Newest')) {
				postPipeline.push({ $sort: { _id: -1 } });
			}

			if (input.tags.includes('Past 30 Days')) {
				const ulid30 = ulid(this.getUnixTimeDaysAgo(30));
				if (!input.cursor || ulid30 > input.cursor) {
					filter._id = { $gt: ulid30 };
				}
			}
		}

		pipeline.push({ $match: filter });
		if (input.limit) postPipeline.push({ $limit: input.limit });

		const query = Storyline.aggregate(pipeline, {
			userID: session?.user.id,
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
		session: Session | null,
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<StorylineProperties>[]> {
		throw new Error('not Implemented');
	}

	async getById(
		session: Session | null,
		id: string
	): Promise<HydratedDocument<StorylineProperties>> {
		const storyline = await Storyline.aggregate([{ $match: { _id: id } }], {
			userID: session?.user.id
		})
			.cursor()
			.next();

		return new Promise<HydratedDocument<StorylineProperties>>((resolve) => {
			resolve(storyline);
		});
	}

	async getByBookID(
		session: Session | null,
		bookID: string,
		main?: boolean | undefined
	): Promise<HydratedDocument<StorylineProperties>[]> {
		const pipeline = [];

		pipeline.push(main ? { $match: { book: bookID, main: true } } : { $match: { book: bookID } });

		const storyline = await Storyline.aggregate(pipeline, {
			userID: session?.user.id
		});

		return new Promise<HydratedDocument<StorylineProperties>[]>((resolve) => {
			resolve(storyline);
		});
	}

	async getStorylinesByUserID(
		session: Session | null,
		id?: string
	): Promise<HydratedDocument<StorylineProperties>[]> {
		const pipeline = [];

		pipeline.push({ $match: { user: id, main: true } });

		const storyline = (await Storyline.aggregate(pipeline, {
			userID: session?.user.id
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
