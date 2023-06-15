import { DBSession } from '$lib/db/session';
import type { BookStorylineResponse } from '$lib/nodes/digital-products/book';
import { Repository } from '$lib/repositories/repository';
import { BookHasStorylineRel } from '$lib/nodes/digital-products/book';

export class StorylinesRepository extends Repository {
	private _bookID?: string;

	constructor() {
		super();
	}

	bookId(bookId: string): StorylinesRepository {
		this._bookID = bookId;
		return this;
	}

	async getAll(limit?: number, skip?: number): Promise<BookStorylineResponse[]> {
		const query = `
            MATCH   (book:Book)-[:${BookHasStorylineRel.label}]->
                    (storyline:Storyline)
            ${this._bookID ? `WHERE book.id='${this._bookID}'` : ``}
			RETURN book, storyline
			${skip ? `SKIP ${skip}` : ''}
			${limit ? `LIMIT ${limit}` : ''}
		`;

		const session = new DBSession();
		const result = await session.executeRead<BookStorylineResponse>(query);

		const storylines: BookStorylineResponse[] = [];
		result.records.forEach((record) => {
			storylines.push(record.toObject());
		});

		return new Promise<BookStorylineResponse[]>((resolve) => {
			resolve(storylines);
		});
	}

	async getByTitle(
		title?: string,
		limit?: number,
		skip?: number
	): Promise<BookStorylineResponse[]> {
		throw new Error('not Implemented');
	}

	async getById(id?: string): Promise<unknown> {
		throw new Error('not Implemented');
	}

	async count(): Promise<number> {
		const count = await this._count('Book');

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
