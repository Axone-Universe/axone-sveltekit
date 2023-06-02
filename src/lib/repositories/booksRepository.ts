import { DBSession } from '$lib/db/session';
import type { UserAuthoredBookResponse } from '$lib/nodes/user';
import { Repository } from '$lib/repositories/repository';

export class BooksRepository extends Repository {
	async get(title?: string, limit?: number, skip?: number): Promise<UserAuthoredBookResponse[]> {
		const query = `
			MATCH (book:Book)<-[authored:AUTHORED]-(user:User)
			${title ? `WHERE book.title = '${title}'` : ''}
			RETURN user, authored, book
			ORDER BY book.title
			${skip ? `SKIP ${skip}` : ''}
			${limit ? `LIMIT ${limit}` : ''}
		`;

		const session = new DBSession();
		const result = await session.executeRead<UserAuthoredBookResponse>(query);

		const books: UserAuthoredBookResponse[] = [];
		result.records.forEach((record) => {
			books.push(record.toObject());
		});

		return new Promise<UserAuthoredBookResponse[]>((resolve) => {
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
