import { Chapter } from '$lib/models/chapter';
import { Storyline } from '$lib/models/storyline';
import { Repository } from '$lib/repositories/repository';
import type { ChapterProperties } from '$lib/shared/chapter';
import type { StorylineProperties } from '$lib/shared/storyline';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';

export class ChaptersRepository extends Repository {
	constructor() {
		super();
	}

	/**
	 * You must specify the chapter to end on otherwise all sub-paths for the storyline will be returned
	 * In the where statement, we end at the leaf chapter or a specified _toChapterID
	 * @param limit
	 * @param skip
	 * @returns
	 */
	async get(
		session: Session | null,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<ChapterProperties>[]> {
		const pipeline = [];

		pipeline.push({ $match: {} });
		if (limit) pipeline.push({ $limit: limit });
		if (skip) pipeline.push({ $skip: skip });

		const chapters = (await Chapter.aggregate(pipeline, {
			userID: session?.user.id
		})) as HydratedDocument<ChapterProperties>[];

		return new Promise<HydratedDocument<ChapterProperties>[]>((resolve) => {
			resolve(chapters);
		});
	}

	async getById(session: Session | null, id: string): Promise<HydratedDocument<ChapterProperties>> {
		const chapter = await Chapter.aggregate([{ $match: { _id: id } }], {
			userID: session?.user.id
		})
			.cursor()
			.next();

		return new Promise<HydratedDocument<ChapterProperties>>((resolve) => {
			resolve(chapter);
		});
	}

	async getByStorylineID(
		session: Session | null,
		storylineChapterIDs?: string[],
		toChapterID?: string
	): Promise<HydratedDocument<ChapterProperties>[]> {
		let chapters: HydratedDocument<ChapterProperties>[] = [];

		const storylineChapters = await Chapter.aggregate(
			[{ $match: { _id: { $in: storylineChapterIDs } } }],
			{
				userID: session?.user.id
			}
		);

		if (!toChapterID) {
			chapters = storylineChapters;
		} else {
			for (const chapter of storylineChapters) {
				chapters.push(chapter);
				if (chapter._id === toChapterID) {
					break;
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

	async count(): Promise<number> {
		const count = await Chapter.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
