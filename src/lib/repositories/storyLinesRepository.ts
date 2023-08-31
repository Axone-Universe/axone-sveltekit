import { Storyline } from '$lib/models/storyline';
import { Repository } from '$lib/repositories/repository';
import type { StorylineProperties } from '$lib/shared/storyline';
import type { Session } from '@supabase/supabase-js';
import type { Document, HydratedDocument } from 'mongoose';

export class StorylinesRepository extends Repository {
	constructor() {
		super();
	}

	async getAll(
		session: Session | null,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<StorylineProperties>[]> {
		const pipeline = [];

		pipeline.push({ $match: {} });
		if (limit) pipeline.push({ $limit: limit });
		if (skip) pipeline.push({ $skip: skip });

		const storylines = (await Storyline.aggregate(pipeline, {
			userID: session?.user.id
		})) as HydratedDocument<StorylineProperties>[];

		return new Promise<HydratedDocument<StorylineProperties>[]>((resolve) => {
			resolve(storylines);
		});
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



	



	async getStorylinesByUserID(session: Session | null, id?: string): Promise<HydratedDocument<StorylineProperties>[]> {
		//const user = await User.findOne({ userID: session?.user.id }); // Find the user by userID
		const storyLines = await Storyline.find({ user: id}, null, { userID: session?.user.id }); // Find books by the user's _id

		return new Promise<HydratedDocument<StorylineProperties>[]>((resolve) => {
			resolve(storyLines);
		});
	}

	async count(): Promise<number> {
		const count = await Storyline.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
