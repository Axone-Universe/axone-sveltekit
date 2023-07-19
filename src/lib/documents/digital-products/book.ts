import { ulid } from 'ulid';
import { DocumentBuilder } from '$lib/documents/documentBuilder';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/shared/book';
import type { Genres } from '$lib/shared/genres';
import { Book } from '$lib/models/book';

export class BookBuilder extends DocumentBuilder<HydratedDocument<BookProperties>> {
	private readonly _bookProperties: BookProperties;
	private readonly _userID: { id?: string };

	constructor(id?: string) {
		super();

		this._bookProperties = {
			_id: id ? id : ulid(),
			user: ''
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

	async build(): Promise<HydratedDocument<BookProperties>> {
		if (!this._userID.id) throw new Error('Must provide userID of author to build book.');

		const book = new Book(this._bookProperties);
		await book.save();

		// We always want to know the creator of a book
		Book.populate(book, { path: 'user' });

		return book as HydratedDocument<BookProperties>;
	}
}
