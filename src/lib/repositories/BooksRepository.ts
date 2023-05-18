import { DBSession } from '$lib/db/session';
import type { BookResponse, BookNode } from '$lib/nodes/digital-products/book';

export class BooksRepository {
	async getBooks(title?: string): Promise<BookResponse[]> {
		const query = `
			MATCH (book:Book)
			${title ? `WHERE book.title = '${title}'` : ''}
			RETURN book
		`;

		const session = new DBSession();
		const result = await session.executeRead<BookResponse>(query);

		const books: BookResponse[] = [];
		result.records.forEach((record) => {
			books.push(record.toObject());
		});

		return new Promise<BookResponse[]>((resolve) => {
			resolve(books);
		});
	}
}
