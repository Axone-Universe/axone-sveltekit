import { ulid } from 'ulid';

import { DocumentBuilder } from '$lib/documents/documentBuilder';
import type { ClientSession, HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import type { ChapterProperties, CommentProperties } from '$lib/properties/chapter';
import { Chapter } from '$lib/models/chapter';
import { Storyline } from '$lib/models/storyline';
import type { PermissionProperties } from '$lib/properties/permission';
import { Delta } from '$lib/models/delta';
import { DeltaBuilder } from '../digital-assets/delta';
import { formatDate } from '$lib/util/constants';

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
			permissions: {}
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

	archived(archived: boolean) {
		this._chapterProperties.archived = archived;
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
				await this.deleteChapterFromParents(session);
				await this.deleteChapterFromStoryline(session);

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

	async deleteChapterFromParents(session: ClientSession) {
		const chapter = await Chapter.aggregate(
			[
				{
					$match: {
						_id: this._chapterProperties._id
					}
				},
				{
					$lookup: {
						from: 'chapters',
						localField: 'children',
						foreignField: '_id',
						as: 'children'
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
			// check if children was created by the owner
			for (const child of children) {
				if (child.user !== chapter.user._id) {
					throw new Error(
						'This chapter was referenced by another author, it can only be archived.'
					);
				}
			}
		}

		// re-assign children to the parent
		const parents = await Chapter.aggregate([
			{
				$match: {
					children: this._chapterProperties._id
				}
			}
		]);

		for (const parent of parents) {
			const parentChapter = new Chapter(parent);
			parentChapter.isNew = false;
			await parentChapter.deleteChild(chapter, session);
		}
	}

	async deleteChapterFromStoryline(session: ClientSession) {
		// remove chapter from storylines refering it
		const storylines = await Storyline.aggregate([
			{
				$match: {
					chapters: this._chapterProperties._id
				}
			}
		]);

		for (const storyline of storylines) {
			const storylineModel = new Storyline(storyline);
			storylineModel.isNew = false;
			await storylineModel.deleteChapter(this._chapterProperties._id, session);
		}
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

			// update delta inherited fields
			if (chapter?.delta) {
				await Delta.findOneAndUpdate(
					{ _id: chapter.delta },
					{ archived: chapter.archived, permissions: chapter.permissions },
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

	async setArchived(ids: string[]): Promise<boolean> {
		const session = await mongoose.startSession();
		let acknowledged = false;
		await session.withTransaction(async () => {
			acknowledged = (
				await Chapter.updateMany(
					{ _id: { $in: ids }, user: this._chapterProperties.user },
					{ archived: this._chapterProperties.archived },
					{
						userID: this._sessionUserID,
						session: session
					}
				)
			).acknowledged;

			if (acknowledged) {
				acknowledged = (
					await Delta.updateMany(
						{ chapter: { $in: ids }, user: this._chapterProperties.user },
						{ archived: this._chapterProperties.archived },
						{
							userID: this._sessionUserID,
							session: session
						}
					)
				).acknowledged;
			}
		});
		session.endSession();

		return acknowledged;
	}

	async createComment(comment: string) {
		const chapter = (await Chapter.aggregate(
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
			.next()) as HydratedDocument<ChapterProperties>;

		const comments = chapter?.comments ?? [];
		const user = typeof chapter.user !== 'string' ? chapter.user : undefined;

		const newComment = {
			_id: ulid(),
			userId: user ? user._id : '',
			firstName: user ? user.firstName ?? '' : '',
			lastName: user ? user.lastName ?? '' : '',
			imageURL: user ? user.imageURL ?? '' : '',
			date: formatDate(new Date()),
			comment: comment
		};

		comments.push(newComment);

		this._chapterProperties.comments = comments;
		return this;
	}

	async build(): Promise<HydratedDocument<ChapterProperties>> {
		if (!this._storylineID) throw new Error('Must provide a storylineID to build the chapter.');
		if (!this._bookID) throw new Error('Must provide bookID of book to build chapter.');

		const session = await mongoose.startSession();

		const chapter: HydratedDocument<ChapterProperties> = new Chapter(this._chapterProperties);

		try {
			await session.withTransaction(async () => {
				// Create the delta
				const deltaBuilder = new DeltaBuilder()
					.sessionUserID(this._sessionUserID!)
					.chapterID(this._chapterProperties._id)
					.userID(this._chapterProperties.user as string)
					.permissions(chapter.permissions);

				const delta = new Delta(deltaBuilder.properties());
				await delta.save({ session });

				// Create the chapter
				chapter.isNew = true;
				chapter.delta = delta._id;
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
				const prevChapterID = storyline.chapters?.at(-1);
				await storyline.addChapter(chapter._id, session);

				if (prevChapterID) {
					const prevChapter = new Chapter(
						await Chapter.aggregate(
							[
								{
									$match: {
										_id: prevChapterID
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
					prevChapter.isNew = false;
					await prevChapter.addChild(chapter._id, session);
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
