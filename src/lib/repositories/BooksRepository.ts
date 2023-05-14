import type { BookProperties } from '$lib/nodes/base/NodeProperties';
import type { Book } from '$lib/nodes/digital-products/Book';
import { neo4jDriver } from '$lib/db/driver';
import type { Session } from 'neo4j-driver';

export class BooksRepository {
	// TODO: supply the context i.e. user sessions, permissions etc
	constructor() {}

	async getBooks(session: Session): Promise<BookProperties[]> {
		const books: BookProperties[] = [];

		const cypher = `MATCH (book:Book)-[:CREATED]-(user:User)
            RETURN book{.*, creator: user{.*}} AS properties`;

		const result = await session.executeRead((tx) => tx.run<Book>(cypher));

		result.records.forEach((record) => {
			books.push(record.get('properties'));
		});

		return new Promise<BookProperties[]>((resolve) => {
			resolve(books);
		});
	}
}
