import { Chapter } from '$lib/models/chapter';
import { Repository } from '$lib/repositories/repository';
import type { ChapterProperties, CommentProperties } from '$lib/properties/chapter';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';
import type { GetByIdSchema, ReadChapter } from '$lib/trpc/schemas/chapters';

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
		readChapter: ReadChapter
	): Promise<HydratedDocument<ChapterProperties>[]> {
		const pipeline = [];
		const filter: any = {};

		if (readChapter.user) filter.user = readChapter.user;
		if (readChapter.storylineID) filter.storyline = readChapter.storylineID;
		if (readChapter.cursor) filter._id = { $gt: readChapter.cursor };
		if (readChapter.archived !== undefined) filter.archived = readChapter.archived;

		pipeline.push({ $match: filter });

		if (readChapter.limit) pipeline.push({ $limit: readChapter.limit });

		const query = Chapter.aggregate(pipeline, {
			userID: session?.user.id
		});

		return await query;
	}

	async getById(session: Session | null, id: string): Promise<HydratedDocument<ChapterProperties>> {
		const chapter = await Chapter.aggregate([{ $match: { _id: id } }], {
			userID: session?.user.id
		})
			.cursor()
			.next();

		return chapter;
	}

	async getByChapterIDs(
		session: Session | null,
		storylineID: string,
		storylineChapterIDs?: string[],
		toChapterID?: string
	): Promise<HydratedDocument<ChapterProperties>[]> {
		let chapters: HydratedDocument<ChapterProperties>[] = [];

		const storylineChapters = await Chapter.aggregate(
			[{ $match: { _id: { $in: storylineChapterIDs } } }],
			{
				userID: session?.user.id,
				storylineID: storylineID
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

		return chapters;
	}

	async getByTitle(
		session: Session,
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<ChapterProperties>[]> {
		throw new Error('not Implemented');
	}

	async getChaptersByUserID(
		session: Session | null,
		id?: string
	): Promise<HydratedDocument<ChapterProperties>[]> {
		const pipeline = [];

		pipeline.push({ $match: { user: id } });
		pipeline.push({
			$lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'book' }
		});
		pipeline.push({ $unwind: '$book' });

		const chapters = (await Chapter.aggregate(pipeline, {
			userID: session?.user.id
		})) as HydratedDocument<ChapterProperties>[];

		return chapters;
	}

	async getComments(
		session: Session | null,
		input: GetByIdSchema
	): Promise<HydratedDocument<CommentProperties>[]> {
		const pipeline = [];

		pipeline.push({ $match: { _id: input.id } });
		pipeline.push({
			$set: {
				comments: { $slice: ['$comments', input.skip ? input.skip : 1, input.limit ?? 10] }
			}
		});

		const chapter = await Chapter.aggregate(pipeline, {
			userID: session?.user.id
		})
			.cursor()
			.next();

		return chapter.comments;
	}

	async count(): Promise<number> {
		return await Chapter.count();
	}
}
