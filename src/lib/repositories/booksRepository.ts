import { DBSession } from '$lib/db/session';
import type { UserAuthoredBookResponse } from '$lib/nodes/user';
import { Repository } from '$lib/repositories/repository';

export class BooksRepository extends Repository {
	async getAll(limit?: number, skip?: number): Promise<UserAuthoredBookResponse[]> {
		const query = `
			MATCH (book:Book)<-[authored:AUTHORED]-(user:User)
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

	async getByTitle(
		title?: string,
		limit?: number,
		skip?: number
	): Promise<UserAuthoredBookResponse[]> {
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

	async getById(id?: string): Promise<unknown> {
		const query = `
			MATCH (book:Book)<-[authored:AUTHORED]-(user:User)
			${id ? `WHERE book.id = '${id}'` : ''}
			RETURN user, authored, book
		`;

		const session = new DBSession();
		const result = await session.executeRead<UserAuthoredBookResponse>(query);

		let book: UserAuthoredBookResponse;
		if (result.records.length > 0) {
			book = result.records[0].toObject();
		}

		return new Promise<UserAuthoredBookResponse>((resolve) => {
			resolve(book);
		});
	}

	async count(): Promise<number> {
		const count = await this._count('Book');

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
