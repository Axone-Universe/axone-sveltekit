import { ulid } from 'ulid';
import { DocumentBuilder } from '$lib/documents/documentBuilder';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/shared/book';
import type { Genres } from '$lib/shared/genres';
import { Book } from '$lib/models/book';
import { Storyline } from '$lib/models/storyline';
import mongoose from 'mongoose';
import { StorylineBuilder } from './storyline';
import type { PermissionProperties } from '$lib/shared/permission';

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
			permissions: new Map()
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

	genres(genres: Genres) {
		this._bookProperties.genres = genres;
		return this;
	}

	permissions(permissions: Map<string, HydratedDocument<PermissionProperties>>) {
		this._bookProperties.permissions = permissions;
		return this;
	}

	sessionUserID(sessionUserID: string): BookBuilder {
		this._sessionUserID = sessionUserID;
		return this;
	}

	async update(): Promise<HydratedDocument<BookProperties>> {
		await Book.findOneAndUpdate({ _id: this._bookProperties._id }, this._bookProperties, {
			new: true,
			userID: this._sessionUserID
		});

		return (await Book.findById(this._bookProperties._id, null, {
			userID: this._sessionUserID
		})) as HydratedDocument<BookProperties>;
	}

	async build(): Promise<HydratedDocument<BookProperties>> {
		if (!this._userID.id) throw new Error('Must provide userID of author to build book.');

		const session = await mongoose.startSession();

		const book = new Book(this._bookProperties);

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
		session.endSession();

		// We always want to know the creator of a book
		Book.populate(book, { path: 'user' });

		return book as HydratedDocument<BookProperties>;
	}
}
