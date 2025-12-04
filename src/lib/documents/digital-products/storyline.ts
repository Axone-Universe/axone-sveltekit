import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import mongoose, { startSession } from 'mongoose';
import type { StorylineProperties } from '$lib/properties/storyline';
import { Storyline } from '$lib/models/storyline';
import type { PermissionProperties } from '$lib/properties/permission';
import { Chapter } from '$lib/models/chapter';
import type { Genre } from '$lib/properties/genre';
import { Book } from '$lib/models/book';
import { BookProperties } from '$lib/properties/book';
import type { UserProperties } from '$lib/properties/user';

export class StorylineBuilder extends DocumentBuilder<HydratedDocument<StorylineProperties>> {
	private readonly _storylineProperties: StorylineProperties;
	private _userID?: string;
	private _bookID?: string;
	// If a storyline has no parent it is the default storyline
	private _parentStorylineID?: string;
	private _branchOffChapterID?: string;
	private _sessionUser?: UserProperties;

	constructor(id?: string) {
		super();
		if (id) {
			// For existing storylines, only set the _id
			this._storylineProperties = {
				_id: id
			} as StorylineProperties;
		} else {
			// For new storylines, initialize with default values
			this._storylineProperties = {
				_id: ulid(),
				imageURL: '',
				main: false,
				permissions: {},
				cumulativeRating: 0,
				numRatings: 0
			};
		}
	}

	title(title: string): StorylineBuilder {
		this._storylineProperties.title = title;
		return this;
	}

	main(main: boolean): StorylineBuilder {
		this._storylineProperties.main = main;
		return this;
	}

	description(description: string): StorylineBuilder {
		this._storylineProperties.description = description;
		return this;
	}

	userID(userID: string): StorylineBuilder {
		this._userID = userID;

		this._storylineProperties.user = userID;

		return this;
	}

	bookID(bookID: string): StorylineBuilder {
		this._bookID = bookID;

		this._storylineProperties.book = bookID;

		return this;
	}

	parentStorylineID(parentStorylineID: string): StorylineBuilder {
		this._parentStorylineID = parentStorylineID;
		return this;
	}

	branchOffChapterID(branchOffChapterID: string): StorylineBuilder {
		this._branchOffChapterID = branchOffChapterID;
		return this;
	}

	imageURL(imageURL: string): StorylineBuilder {
		this._storylineProperties.imageURL = imageURL;
		return this;
	}

	properties() {
		return this._storylineProperties;
	}

	permissions(permissions: Record<string, HydratedDocument<PermissionProperties>>) {
		super.permissions(permissions);
		this._storylineProperties.permissions = permissions;
		return this;
	}

	archived(archived: boolean) {
		this._storylineProperties.archived = archived;
		return this;
	}

	sessionUser(sessionUser: UserProperties): StorylineBuilder {
		this._sessionUser = sessionUser;
		return this;
	}

	genres(genres: Genre[]) {
		this._storylineProperties.genres = genres;
		return this;
	}

	tags(tags: string[]) {
		this._storylineProperties.tags = tags;
		return this;
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		const session = await mongoose.startSession();

		let result = {};

		await session.withTransaction(async () => {
			const chapters = await Chapter.aggregate(
				[
					{
						$match: {
							storyline: this._storylineProperties._id
						}
					}
				],
				{
					user: this._sessionUser
				}
			);

			if (chapters && chapters.length !== 0) {
				throw new Error('Please delete all chapters before deleting the storyline');
			}

			const books = (await Book.aggregate(
				[
					{
						$match: {
							storylines: this._storylineProperties._id
						}
					}
				],
				{
					user: this._sessionUser,
					comments: true
				}
			)) as HydratedDocument<BookProperties>[];

			await Promise.all(
				books.map((bookDocument) => {
					const book = new Book(bookDocument);
					book.isNew = false;
					book.removeStoryline(this._storylineProperties._id, session);
				})
			);

			result = await Storyline.deleteOne(
				{ _id: this._storylineProperties._id },
				{ session: session, user: this._sessionUser }
			);

			return result;
		});
		session.endSession();

		return result as mongoose.mongo.DeleteResult;
	}

	async update(): Promise<HydratedDocument<StorylineProperties>> {
		const storyline = await Storyline.findOneAndUpdate(
			{ _id: this._storylineProperties._id },
			this._storylineProperties,
			{
				new: true,
				user: this._sessionUser
			}
		);

		if (storyline) {
			return storyline;
		}

		throw new Error("Couldn't update storyline");
	}

	async setArchived(ids: string[]): Promise<boolean> {
		const session = await startSession();
		let acknowledged = false;

		try {
			await session.withTransaction(async () => {
				acknowledged = (
					await Storyline.updateMany(
						{ _id: { $in: ids }, user: this._storylineProperties.user },
						{ archived: this._storylineProperties.archived },
						{
							user: this._sessionUser,
							session
						}
					)
				).acknowledged;

				if (acknowledged) {
					await Chapter.updateMany(
						{ storyline: { $in: ids }, user: this._storylineProperties.user },
						{ archived: this._storylineProperties.archived },
						{
							user: this._sessionUser,
							session
						}
					);
				}
			});
		} finally {
			session.endSession();
		}

		return acknowledged;
	}

	/**
	 * If a parent storyline is provided, the new storyline will link to all the parent's chapters
	 *      UP TO the branch-off chapter which should be specified as well.
	 * @returns
	 */
	async build(): Promise<HydratedDocument<StorylineProperties>> {
		if (!this._userID) throw new Error('Must provide userID of author to build storyline.');
		if (!this._bookID) throw new Error('Must provide bookID of book to build storyline.');
		if (this._parentStorylineID && !this._branchOffChapterID) {
			throw new Error(
				'Must provide the chapter to branch off from if parent storyline is specified'
			);
		}

		const storyline = new Storyline(this._storylineProperties);

		// get the parent chapter ids
		// we assume they are already sorted in correct order by the push
		if (this._parentStorylineID) {
			const parentStoryline = await Storyline.aggregate(
				[
					{
						$match: {
							_id: this._parentStorylineID
						}
					}
				],
				{
					user: this._sessionUser
				}
			)
				.cursor()
				.next();

			for (const chapter of parentStoryline.chapters) {
				const chapterID = typeof chapter === 'string' ? chapter : chapter._id;

				storyline.chapters?.push(chapterID);
				if (chapterID === this._branchOffChapterID) {
					break;
				}
			}
		}

		const session = await mongoose.startSession();

		try {
			await session.withTransaction(async () => {
				// add storyline to the book storyline array
				const book = new Book(
					await Book.aggregate(
						[
							{
								$match: {
									_id: this._bookID
								}
							}
						],
						{
							user: this._sessionUser
						}
					)
						.session(session)
						.cursor()
						.next()
				);
				book.isNew = false;

				await book.addStoryline(this._storylineProperties._id, session);
				await storyline.save({ session });
			});
		} finally {
			session.endSession();
		}

		return storyline;
	}
}
