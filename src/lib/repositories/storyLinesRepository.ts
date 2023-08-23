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
		let query = Storyline.find(this._bookID ? { book: this._bookID } : {}, null, {
			userID: session?.user.id
		});

		if (skip) {
			query = query.skip(skip);
		}

		if (limit) {
			query = query.limit(limit);
		}

		const storylines = await query;

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
		id?: string
	): Promise<HydratedDocument<StorylineProperties>> {
		let query;

		if (!id) {
			query = Storyline.findOne({ main: true, book: this._bookID }, null, {
				userID: session?.user.id
			});
		} else {
			query = Storyline.findById(id, null, { userID: session?.user.id });
		}

		const storyline = await query;

		return new Promise<HydratedDocument<StorylineProperties>>((resolve) => {
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
