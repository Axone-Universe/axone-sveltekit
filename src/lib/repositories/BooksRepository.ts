import { DBSession } from '$lib/db/session';
import type { BookProperties } from '$lib/nodes/base/NodeProperties';
import type { BookHandler } from '$lib/nodes/digital-products/Book';

export class BooksRepository {
	// TODO: supply the context i.e. user sessions, permissions etc
	// constructor() {}

	async getBooks(title?: string): Promise<BookProperties[]> {
		const books: BookProperties[] = [];

		const cypher = `MATCH (book:Book) ${
			title ? `WHERE book.title = '${title}'` : ''
		} RETURN book{.*} AS properties`;

		const session = new DBSession();
		const result = await session.executeRead<BookHandler>(cypher);

		result.records.forEach((record) => {
			books.push(record.get('properties'));
		});

		return new Promise<BookProperties[]>((resolve) => {
			resolve(books);
		});
	}
}
