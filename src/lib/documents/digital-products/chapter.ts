import { ulid } from 'ulid';

import { DocumentBuilder } from '$lib/documents/documentBuilder';
import type { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import type { ChapterProperties } from '$lib/properties/chapter';
import { Chapter } from '$lib/models/chapter';
import { Storyline } from '$lib/models/storyline';
import type { PermissionProperties } from '$lib/properties/permission';
import { Delta } from '$lib/models/delta';

export class ChapterBuilder extends DocumentBuilder<HydratedDocument<ChapterProperties>> {
	private readonly _chapterProperties: ChapterProperties;
	private _prevChapterID?: string;
	private _bookID?: string;
	private _storylineID?: string;
	private _sessionUserID?: string;

	constructor(id?: string) {
		super();
		this._chapterProperties = {
			_id: id ? id : ulid(),
			permissions: {},
			published: false
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
		this._chapterProperties.user = userID;
		return this;
	}

	storylineID(storylineID: string): ChapterBuilder {
		this._storylineID = storylineID;
		this._chapterProperties.storyline = storylineID;
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

	permissions(permissions: Record<string, HydratedDocument<PermissionProperties>>) {
		this._chapterProperties.permissions = permissions;
		return this;
	}

	published(published: boolean) {
		this._chapterProperties.published = published;
		return this;
	}

	sessionUserID(sessionUserID: string): ChapterBuilder {
		this._sessionUserID = sessionUserID;
		return this;
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		const session = await mongoose.startSession();

		let result = {};

		try {
			await session.withTransaction(async () => {
				const chapter = await Chapter.aggregate(
					[
						{
							$match: {
								_id: this._chapterProperties._id
							}
						}
					],
					{
						userID: this._sessionUserID
					}
				)
					.cursor()
					.next();

				const children = chapter.children;
				if (children && children.length !== 0) {
					// re-assign children to the parent
					const parents = await Chapter.aggregate([
						{
							$match: {
								children: this._chapterProperties._id
							}
						}
					]);

					for (const parent of parents) {
						parent.children = parent.children.concat(children);

						await Chapter.findOneAndUpdate({ _id: parent._id }, parent, {
							userID: this._sessionUserID,
							session: session
						});
					}
				}

				result = await Chapter.deleteOne(
					{ _id: this._chapterProperties._id },
					{ session: session, userID: this._sessionUserID }
				);

				return result;
			});
		} finally {
			session.endSession();
		}

		return result as mongoose.mongo.DeleteResult;
	}

	async update(): Promise<HydratedDocument<ChapterProperties>> {
		const session = await mongoose.startSession();
		await session.withTransaction(async () => {
			const chapter = await Chapter.findOneAndUpdate(
				{ _id: this._chapterProperties._id },
				this._chapterProperties,
				{
					new: true,
					userID: this._sessionUserID,
					session: session
				}
			);

			// update delta permissions as well
			if (chapter?.delta) {
				await Delta.findOneAndUpdate(
					{ _id: chapter.delta },
					{ permissions: this._chapterProperties.permissions },
					{ session }
				);
			}
		});
		session.endSession();

		const chapter = await Chapter.aggregate(
			[
				{
					$match: {
						_id: this._chapterProperties._id
					}
				}
			],
			{
				userID: this._sessionUserID
			}
		)
			.cursor()
			.next();

		return chapter;
	}

	async build(): Promise<HydratedDocument<ChapterProperties>> {
		if (!this._storylineID) throw new Error('Must provide a storylineID to build the chapter.');
		if (!this._bookID) throw new Error('Must provide bookID of book to build chapter.');

		const session = await mongoose.startSession();

		const chapter: HydratedDocument<ChapterProperties> = new Chapter(this._chapterProperties);

		try {
			// use a transaction to make sure everything saves
			await session.withTransaction(async () => {
				chapter.isNew = true;
				await chapter.save({ session });

				const storyline = new Storyline(
					await Storyline.aggregate(
						[
							{
								$match: {
									_id: this._storylineID
								}
							}
						],
						{
							userID: this._chapterProperties.user
						}
					)
						.session(session)
						.cursor()
						.next()
				);
				storyline.isNew = false;
				await storyline.addChapter(chapter._id, session);

				if (this._prevChapterID) {
					const prevChapter = await Chapter.aggregate(
						[
							{
								$match: {
									_id: this._prevChapterID
								}
							}
						],
						{
							userID: this._chapterProperties.user
						}
					)
						.session(session)
						.cursor()
						.next();

					prevChapter.children.push(chapter._id);
					await Chapter.findOneAndUpdate({ _id: prevChapter._id }, prevChapter, {
						userID: this._sessionUserID,
						session
					});
				}
			});
		} finally {
			session.endSession();
		}

		const newChapter = await Chapter.aggregate(
			[
				{
					$match: {
						_id: this._chapterProperties._id
					}
				}
			],
			{
				userID: this._chapterProperties.user
			}
		)
			.cursor()
			.next();

		return newChapter;
	}
}
