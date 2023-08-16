import { Chapter } from '$lib/models/chapter';
import { Storyline } from '$lib/models/storyline';
import { Repository } from '$lib/repositories/repository';
import type { ChapterProperties } from '$lib/shared/chapter';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';

export class ChaptersRepository extends Repository {
	// TODO: repository should not have specific id's?
	private _storylineID?: string;
	private _toChapterID?: string;

	constructor() {
		super();
	}

	storylineID(storylineID: string): ChaptersRepository {
		this._storylineID = storylineID;
		return this;
	}

	toChapterID(toChapterID: string): ChaptersRepository {
		this._toChapterID = toChapterID;
		return this;
	}

	/**
	 * You must specify the chapter to end on otherwise all sub-paths for the storyline will be returned
	 * In the where statement, we end at the leaf chapter or a specified _toChapterID
	 * @param limit
	 * @param skip
	 * @returns
	 */
	async getAll(
		session: Session | null,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<ChapterProperties>[]> {
		let chapters: HydratedDocument<ChapterProperties>[] = [];

		if (this._storylineID) {
			const storyline = await Storyline.findOne({ _id: this._storylineID }, null, {
				userID: session?.user.id
			});

			const storylineChapters = storyline.chapters;

			if (!this._toChapterID) {
				chapters = storylineChapters;
			} else {
				for (const chapter of storylineChapters) {
					chapters.push(chapter);
					if (chapter._id === this._toChapterID) {
						break;
					}
				}
			}
		}

		return new Promise<HydratedDocument<ChapterProperties>[]>((resolve) => {
			resolve(chapters);
		});
	}

	async getByTitle(
		session: Session,
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<ChapterProperties>[]> {
		throw new Error('not Implemented');
	}

	async getById(session: Session, id?: string): Promise<unknown> {
		throw new Error('not Implemented');
	}

	async getChaptersByUserID(session: Session | null, id?: string, skip?: number): Promise<HydratedDocument<ChapterProperties>[]> {
		//const user = await User.findOne({ userID: session?.user.id }); // Find the user by userID
		const chapters = await Chapter.find({ user: id}, null, { userID: session?.user.id }); // Find books by the user's _id

		return new Promise<HydratedDocument<ChapterProperties>[]>((resolve) => {
			resolve(chapters);
		});
	}
	async count(): Promise<number> {
		const count = await Chapter.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
