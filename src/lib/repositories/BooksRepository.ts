import { session } from '$lib/db/session';
import type { BookProperties } from '$lib/nodes/base/NodeProperties';
import type { Book } from '$lib/nodes/digital-products/Book';

export class BooksRepository {
	// TODO: supply the context i.e. user sessions, permissions etc
	// constructor() {}

	async getBooks(): Promise<BookProperties[]> {
		const books: BookProperties[] = [];

		const cypher = `MATCH (book:Book)-[:CREATED]-(user:User)
            RETURN book{.*, creator: user{.*}} AS properties`;

		const result = await session.executeRead<Book>(cypher);

		result.records.forEach((record) => {
			books.push(record.get('properties'));
		});

		return new Promise<BookProperties[]>((resolve) => {
			resolve(books);
		});
	}
}
