import { DBSession } from '$lib/db/session';
import type { BookResponse } from '$lib/nodes/digital-products/book';
import { Repository } from '$lib/repositories/repository';

export class BooksRepository extends Repository {
	async get(title?: string, limit?: number, skip?: number): Promise<BookResponse[]> {
		const query = `
			MATCH (book:Book)
			${title ? `WHERE book.title = '${title}'` : ''}
			RETURN book
			ORDER BY book.title
			${skip ? `SKIP ${skip}` : ''}
			${limit ? `LIMIT ${limit}` : ''}
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

	async count(): Promise<number> {
		const count = await this._count('Book');

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
