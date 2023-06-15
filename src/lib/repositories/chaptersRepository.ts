import { DBSession } from '$lib/db/session';
import type { Node } from 'neo4j-driver';
import type { StorylineChapterResponse } from '$lib/nodes/digital-products/storyline';
import { Repository } from '$lib/repositories/repository';
import { BookHasChapterRel } from '$lib/nodes/digital-products/book';
import { ChapterPrecedesChapterRel, type ChapterNode } from '$lib/nodes/digital-products/chapter';

export class ChaptersRepository extends Repository {
	private _storylineID?: string;

	constructor() {
		super();
	}

	storylineID(storylineID: string): ChaptersRepository {
		this._storylineID = storylineID;
		return this;
	}

	async getAll(limit?: number, skip?: number): Promise<ChapterNode[]> {
		const query = `
            MATCH	p = (storyline:Storyline)-[:${BookHasChapterRel.label}]->
				  	(:Chapter {head: true})-[:${ChapterPrecedesChapterRel.label}*1]->
					(:Chapter)
            ${this._storylineID ? `WHERE storyline.id='${this._storylineID}'` : ``}
			RETURN nodes(p)
			${skip ? `SKIP ${skip}` : ''}
			${limit ? `LIMIT ${limit}` : ''}
		`;

		const session = new DBSession();
		const result = await session.executeRead(query);

		const resultNodes = result.records[0].get('nodes(p)');
		const chapters: ChapterNode[] = [];

		resultNodes.forEach((node: ChapterNode) => {
			if (node.labels.includes('Chapter')) {
				chapters.push(node);
			}
		});

		return new Promise<ChapterNode[]>((resolve) => {
			resolve(chapters);
		});
	}

	async getByTitle(
		title?: string,
		limit?: number,
		skip?: number
	): Promise<StorylineChapterResponse[]> {
		throw new Error('not Implemented');
	}

	async getById(id?: string): Promise<unknown> {
		throw new Error('not Implemented');
	}

	async count(): Promise<number> {
		const count = await this._count('Storyline');

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
