import { Storyline } from '$lib/models/storyline';
import { Repository } from '$lib/repositories/repository';
import type { StorylineProperties } from '$lib/shared/storyline';
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

	async getAll(limit?: number, skip?: number): Promise<HydratedDocument<StorylineProperties>[]> {
		let query = Storyline.find(this._bookID ? { book: this._bookID } : {});

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
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<StorylineProperties>[]> {
		throw new Error('not Implemented');
	}

	async getById(id?: string): Promise<HydratedDocument<StorylineProperties>> {
		let query;

		if (!id) {
			query = Storyline.findOne({ main: true, book: this._bookID });
		} else {
			query = await Storyline.findById(id);
		}

		const storyline = await query;

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
