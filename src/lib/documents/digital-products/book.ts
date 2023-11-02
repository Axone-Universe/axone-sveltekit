import { ulid } from 'ulid';
import { DocumentBuilder } from '$lib/documents/documentBuilder';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import type { Genre } from '$lib/properties/genre';
import { Book } from '$lib/models/book';
import { Storyline } from '$lib/models/storyline';
import mongoose, { startSession } from 'mongoose';
import { StorylineBuilder } from './storyline';
import type { PermissionProperties } from '$lib/properties/permission';
import { Chapter } from '$lib/models/chapter';

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

	imageURL(imageURL: string): BookBuilder {
		this._bookProperties.imageURL = imageURL;
		return this;
	}

	genres(genres: Genre[]) {
		this._bookProperties.genres = genres;
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

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		const session = await mongoose.startSession();

		let result = {};

		await session.withTransaction(async () => {
			const book = await Book.aggregate(
				[
					{
						$match: {
							_id: this._bookProperties._id
						}
					}
				],
				{
					userID: this._sessionUserID
				}
			)
				.cursor()
				.next();

			const children = book.children;
			if (children && children.length !== 0) {
				// re-assign children to the parent
				const parents = await Book.aggregate([
					{
						$match: {
							children: this._bookProperties._id
						}
					}
				]);

				for (const parent of parents) {
					parent.children = parent.children.concat(children);

					await Book.findOneAndUpdate({ _id: parent._id }, parent, {
						userID: this._sessionUserID,
						session: session
					});
				}
			}

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
		let book = await Book.findOneAndUpdate(
			{ _id: this._bookProperties._id },
			this._bookProperties,
			{
				new: true,
				userID: this._sessionUserID
			}
		);

		if (book) {
			// aggregate is called again so that the db middleware runs
			book = await Book.aggregate(
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

		throw new Error("Couldn't update book");
	}

	async setArchived(): Promise<HydratedDocument<BookProperties>> {
		const session = await startSession();
		let book: HydratedDocument<BookProperties> | null = null;

		try {
			await session.withTransaction(async () => {
				book = await Book.findOneAndUpdate(
					{ _id: this._bookProperties._id },
					{ archived: this._bookProperties.archived },
					{
						new: true,
						userID: this._sessionUserID,
						session
					}
				);

				if (book) {
					await Storyline.updateMany(
						{ book: this._bookProperties._id, user: this._bookProperties.user },
						{ archived: this._bookProperties.archived },
						{
							new: true,
							userID: this._sessionUserID,
							session
						}
					);

					await Chapter.updateMany(
						{ book: this._bookProperties._id, user: this._bookProperties.user },
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

		if (book) {
			return book;
		}

		throw new Error("Couldn't update book");
	}

	async build(): Promise<HydratedDocument<BookProperties>> {
		if (!this._userID.id) throw new Error('Must provide userID of author to build book.');

		const session = await mongoose.startSession();

		const book = new Book(this._bookProperties);

		try {
			// use a transaction to make sure everything saves
			await session.withTransaction(async () => {
				await book.save({ session });

				const hydratedBook = book as HydratedDocument<BookProperties>;

				// Also create the default/main storyline
				const storylineBuilder = new StorylineBuilder()
					.userID(typeof hydratedBook.user === 'string' ? hydratedBook.user : hydratedBook.user._id)
					.bookID(hydratedBook._id)
					.title(hydratedBook.title!)
					.main(true)
					.description(hydratedBook.description!)
					.imageURL(hydratedBook.imageURL!)
					.permissions(hydratedBook.permissions);

				const storyline = new Storyline(storylineBuilder.properties());
				await storyline.save({ session });
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
}
