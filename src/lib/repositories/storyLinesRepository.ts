import { Storyline } from '$lib/models/storyline';
import { Repository } from '$lib/repositories/repository';
import type { StorylineProperties } from '$lib/properties/storyline';
import type { Session } from '@supabase/supabase-js';
import type { Document, HydratedDocument } from 'mongoose';
import type { ReadStoryline } from '$lib/trpc/schemas/storylines';

export class StorylinesRepository extends Repository {
	constructor() {
		super();
	}

	async get(
		session: Session | null,
		readStoryline: ReadStoryline
	): Promise<HydratedDocument<StorylineProperties>[]> {
		const pipeline = [];
		const filter: any = {};

		if (readStoryline.user) filter.user = readStoryline.user;
		if (readStoryline.bookID) filter.book = readStoryline.bookID;
		if (readStoryline.cursor) filter._id = { $gt: readStoryline.cursor };
		if (readStoryline.archived !== undefined) filter.archived = readStoryline.archived;

		pipeline.push({ $match: filter });

		if (readStoryline.limit) pipeline.push({ $limit: readStoryline.limit });

		const query = Storyline.aggregate(pipeline, {
			userID: session?.user.id
		});

		return await query;
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

	// async getHighestReview() {
	// 	const storylines = (await Storyline.aggregate([{
	// 		$group:
	// 	}])) as HydratedDocument<StorylineProperties>[];
	// }
}
