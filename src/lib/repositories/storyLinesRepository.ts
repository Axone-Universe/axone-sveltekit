import { DBSession } from '$lib/db/session';
import type { BookStorylineResponse } from '$lib/nodes/digital-products/book';
import { Repository } from '$lib/repositories/repository';
import { BookHasStorylineRel } from '$lib/nodes/digital-products/book';
import type { StorylineResponse } from '$lib/nodes/digital-products/storyline';

export class StorylinesRepository extends Repository {
	private _bookID?: string;

	constructor() {
		super();
	}

	bookId(bookId: string): StorylinesRepository {
		this._bookID = bookId;
		return this;
	}

	async getAll(limit?: number, skip?: number): Promise<StorylineResponse[]> {
		const query = `
            MATCH   (book:Book)-[:${BookHasStorylineRel.label}]->
                    (storyline:Storyline)
            ${this._bookID ? `WHERE book.id='${this._bookID}'` : ``}
			RETURN storyline
			${skip ? `SKIP ${skip}` : ''}
			${limit ? `LIMIT ${limit}` : ''}
		`;

		const session = new DBSession();
		const result = await session.executeRead<StorylineResponse>(query);

		const storylines: StorylineResponse[] = [];
		result.records.forEach((record) => {
			storylines.push(record.toObject());
		});

		return new Promise<StorylineResponse[]>((resolve) => {
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

	async getById(id?: string): Promise<StorylineResponse> {
		const query = `
            MATCH   (book:Book)-[:${BookHasStorylineRel.label}]->
                    (storyline:Storyline)
            WHERE book.id='${this._bookID}' AND
			${id ? ` storyline.id='${id}'` : ` storyline.main=true`}
			RETURN storyline
		`;

		const session = new DBSession();
		const result = await session.executeRead<StorylineResponse>(query);

		let storyline: StorylineResponse;
		result.records.forEach((record) => {
			storyline = record.toObject();
		});

		return new Promise<StorylineResponse>((resolve) => {
			resolve(storyline);
		});
	}

	async count(): Promise<number> {
		const count = await this._count('Book');

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
