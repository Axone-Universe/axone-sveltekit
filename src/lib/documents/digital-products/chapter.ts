import { ulid } from 'ulid';

import { DocumentBuilder } from '$lib/documents/documentBuilder';
import type { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import type { ChapterProperties } from '$lib/shared/chapter';
import { Chapter } from '$lib/models/chapter';
import { Storyline } from '$lib/models/storyline';

export class ChapterBuilder extends DocumentBuilder<HydratedDocument<ChapterProperties>> {
	private readonly _chapterProperties: ChapterProperties;
	private _prevChapterID?: string;
	private _userID?: string;
	private _bookID?: string;
	private _storylineID?: string;

	constructor(id?: string) {
		super();
		this._chapterProperties = {
			_id: id ? id : ulid()
		};
	}

	title(title: string): ChapterBuilder {
		this._chapterProperties.title = title;
		return this;
	}

	description(description: string): ChapterBuilder {
		this._chapterProperties.description = description;
		return this;
	}

	userID(userID: string): ChapterBuilder {
		this._userID = userID;

		this._chapterProperties.user = userID;

		return this;
	}

	storylineID(storylineID: string): ChapterBuilder {
		this._storylineID = storylineID;

		return this;
	}

	bookID(bookID: string): ChapterBuilder {
		this._bookID = bookID;

		this._chapterProperties.book = bookID;

		return this;
	}

	prevChapterID(prevChapterID: string) {
		this._prevChapterID = prevChapterID;
		return this;
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		const session = await mongoose.startSession();

		let result = {};

		await session.withTransaction(async () => {
			const chapter = await Chapter.findById(this._chapterProperties._id);

			const children = chapter.children;
			if (children && children.length !== 0) {
				// re-assign children to the parent
				const parents = await Chapter.find({
					children: this._chapterProperties._id
				});

				for (const parent of parents) {
					parent.children = parent.children.concat(children);
					await parent.save({ session });
				}
			}

			result = await Chapter.deleteOne({ _id: this._chapterProperties._id }, { session });

			return result;
		});
		session.endSession();

		return result as mongoose.mongo.DeleteResult;
	}

	async update(): Promise<HydratedDocument<ChapterProperties>> {
		const chapter = await Chapter.findOneAndUpdate(
			{ _id: this._chapterProperties._id },
			this._chapterProperties,
			{ new: true }
		);

		return chapter;
	}

	async build(): Promise<HydratedDocument<ChapterProperties>> {
		if (!this._storylineID) throw new Error('Must provide a storylineID to build the chapter.');
		if (!this._bookID) throw new Error('Must provide bookID of book to build chapter.');

		const session = await mongoose.startSession();

		const chapter: HydratedDocument<ChapterProperties> = new Chapter(this._chapterProperties);

		// use a transaction to make sure everything saves
		await session.withTransaction(async () => {
			await chapter.save({ session });

			const storyline = await Storyline.findById(this._storylineID);
			storyline.chapters.push(chapter._id);
			await storyline.save({ session });

			if (this._prevChapterID) {
				const prevChapter = await Chapter.findById(this._prevChapterID);
				prevChapter.children.push(chapter._id);
				await prevChapter.save({ session });
			}
		});
		session.endSession();

		return chapter!;
	}
}
