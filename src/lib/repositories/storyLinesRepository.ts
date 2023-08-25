import { Storyline } from '$lib/models/storyline';
import { Repository } from '$lib/repositories/repository';
import type { StorylineProperties } from '$lib/shared/storyline';
import type { Session } from '@supabase/supabase-js';
import type { Document, HydratedDocument } from 'mongoose';

export class StorylinesRepository extends Repository {
	private _bookID?: string;

	constructor() {
		super();
	}

	bookId(bookId: string): StorylinesRepository {
		this._bookID = bookId;
		return this;
	}

	async getAll(
		session: Session | null,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<StorylineProperties>[]> {
		const pipeline = [];

		if (this._bookID) pipeline.push({ $match: { book: this._bookID } });
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
		bookID: string
	): Promise<HydratedDocument<StorylineProperties>> {
		const storyline = await Storyline.aggregate([{ $match: { book: bookID } }], {
			userID: session?.user.id
		})
			.cursor()
			.next();

		return new Promise<HydratedDocument<StorylineProperties>>((resolve) => {
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
