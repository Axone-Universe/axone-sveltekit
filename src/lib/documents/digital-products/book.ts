import { ulid } from 'ulid';
import { DocumentBuilder } from '$lib/documents/documentBuilder';
import type { ClientSession, HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import type { Genre } from '$lib/properties/genre';
import { Book } from '$lib/models/book';
import { Storyline } from '$lib/models/storyline';
import mongoose, { startSession } from 'mongoose';
import { StorylineBuilder } from './storyline';
import type { PermissionProperties } from '$lib/properties/permission';
import { Chapter } from '$lib/models/chapter';
import { Campaign } from '$lib/models/campaign';

export class BookBuilder extends DocumentBuilder<HydratedDocument<BookProperties>> {
	private readonly _bookProperties: BookProperties;
	private readonly _userID: { id?: string };
	private _sessionUserID?: string;

	constructor(id?: string) {
		super();

		this._bookProperties = {
			_id: id ? id : ulid(),
			user: '',
			title: '',
			imageURL: '',
			description: '',
			permissions: {},
			genres: [],
			rating: 0
		};
		this._userID = {};
	}

	title(title: string): BookBuilder {
		this._bookProperties.title = title;
		return this;
	}

	description(description: string): BookBuilder {
		this._bookProperties.description = description;
		return this;
	}

	userID(userID: string): BookBuilder {
		this._userID.id = userID;

		this._bookProperties.user = userID;

		return this;
	}

	imageURL(imageURL: string | undefined): BookBuilder {
		if (imageURL) this._bookProperties.imageURL = imageURL;
		return this;
	}

	genres(genres: Genre[]) {
		this._bookProperties.genres = genres;
		return this;
	}

	tags(tags: string[]) {
		this._bookProperties.tags = tags;
		return this;
	}

	permissions(permissions: Record<string, HydratedDocument<PermissionProperties>>) {
		this._bookProperties.permissions = permissions;
		return this;
	}

	archived(archived: boolean) {
		this._bookProperties.archived = archived;
		return this;
	}

	sessionUserID(sessionUserID: string): BookBuilder {
		this._sessionUserID = sessionUserID;
		return this;
	}

	async addStoryline(storylineID: string) {
		const book = new Book(
			await Book.aggregate(
				[
					{
						$match: {
							_id: this._bookProperties._id
						}
					}
				],
				{
					userID: this._sessionUserID,
					comments: true
				}
			)
				.cursor()
				.next()
		);

		book.isNew = false;
		return await book.addStoryline(storylineID);
	}

	async removeStoryline(storylineID: string) {
		const book = new Book(
			await Book.aggregate(
				[
					{
						$match: {
							_id: this._bookProperties._id
						}
					}
				],
				{
					userID: this._sessionUserID,
					comments: true
				}
			)
				.cursor()
				.next()
		);

		const storyline = new Storyline(
			await Storyline.aggregate(
				[
					{
						$match: {
							_id: storylineID
						}
					}
				],
				{
					userID: this._sessionUserID,
					comments: true
				}
			)
				.cursor()
				.next()
		);

		if (storyline.book === book._id) {
			throw new Error('You cannot remove a storyline from its main book/campaign');
		}

		book.isNew = false;
		return await book.removeStoryline(storylineID);
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		const session = await mongoose.startSession();

		let result = {};

		await session.withTransaction(async () => {
			const storylines = await Storyline.aggregate(
				[
					{
						$match: {
							book: this._bookProperties._id
						}
					}
				],
				{
					userID: this._sessionUserID
				}
			);

			if (storylines && storylines.length !== 0) {
				throw new Error('Please delete all storylines before deleting the book');
			}

			// delete any campaign linked to the book
			await Campaign.deleteOne(
				{ book: this._bookProperties._id },
				{ session: session, userID: this._sessionUserID }
			);

			result = await Book.deleteOne(
				{ _id: this._bookProperties._id },
				{ session: session, userID: this._sessionUserID }
			);

			return result;
		});
		session.endSession();

		return result as mongoose.mongo.DeleteResult;
	}

	async update(): Promise<HydratedDocument<BookProperties>> {
		const session = await startSession();

		try {
			// use a transaction to make sure everything saves
			await session.withTransaction(async () => {
				await Book.findOneAndUpdate({ _id: this._bookProperties._id }, this._bookProperties, {
					new: true,
					userID: this._sessionUserID
				});

				await Storyline.findOneAndUpdate(
					{ $and: [{ book: this._bookProperties._id }, { main: true }] },
					{ imageURL: this._bookProperties.imageURL },
					{
						userID: this._sessionUserID
					}
				);
			});
		} finally {
			session.endSession();
		}

		// aggregate is called again so that the db middleware runs
		const book = await Book.aggregate(
			[
				{
					$match: {
						_id: this._bookProperties._id
					}
				}
			],
			{
				userID: this._userID.id
			}
		)
			.cursor()
			.next();

		return book as HydratedDocument<BookProperties>;
	}

	async setArchived(ids: string[]): Promise<boolean> {
		const session = await startSession();
		let acknowledged = false;

		try {
			await session.withTransaction(async () => {
				acknowledged = (
					await Book.updateMany(
						{ _id: { $in: ids }, user: this._bookProperties.user },
						{ archived: this._bookProperties.archived },
						{
							new: true,
							userID: this._sessionUserID,
							session
						}
					)
				).acknowledged;

				if (acknowledged) {
					await Storyline.updateMany(
						{ book: { $in: ids }, user: this._bookProperties.user },
						{ archived: this._bookProperties.archived },
						{
							new: true,
							userID: this._sessionUserID,
							session
						}
					);

					await Chapter.updateMany(
						{ book: { $in: ids }, user: this._bookProperties.user },
						{ archived: this._bookProperties.archived },
						{
							new: true,
							userID: this._sessionUserID,
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

	async build(): Promise<HydratedDocument<BookProperties>> {
		if (!this._userID.id) throw new Error('Must provide userID of author to build book.');

		const session = await mongoose.startSession();

		const book = new Book(this._bookProperties);

		try {
			// use a transaction to make sure everything saves
			await session.withTransaction(async () => {
				await saveBook(book, session);
			});
		} finally {
			session.endSession();
		}

		const newBook = await Book.aggregate(
			[
				{
					$match: {
						_id: this._bookProperties._id
					}
				}
			],
			{
				userID: this._userID.id
			}
		)
			.cursor()
			.next();

		return newBook as HydratedDocument<BookProperties>;
	}

	properties(): BookProperties {
		return this._bookProperties;
	}
}

export async function saveBook(book: HydratedDocument<BookProperties>, session: ClientSession) {
	const hydratedBook = book as HydratedDocument<BookProperties>;

	const permissions: Record<string, HydratedDocument<PermissionProperties>> = {};
	permissions['public'] = {
		_id: ulid(),
		permission: 'view'
	} as HydratedDocument<PermissionProperties>;

	// Also create the default/main storyline
	const storylineBuilder = new StorylineBuilder()
		.userID(typeof hydratedBook.user === 'string' ? hydratedBook.user : hydratedBook.user._id)
		.bookID(hydratedBook._id)
		.title(hydratedBook.title!)
		.main(true)
		.description(hydratedBook.description!)
		.imageURL(hydratedBook.imageURL!)
		.genres(hydratedBook.genres!)
		.tags(hydratedBook.tags!)
		.permissions(hydratedBook.campaign ? permissions : hydratedBook.permissions);

	const storyline = new Storyline(storylineBuilder.properties());
	await storyline.save({ session });

	// save book
	book.storylines = [storyline.id];
	await book.save({ session });
}
