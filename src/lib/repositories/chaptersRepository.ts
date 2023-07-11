import { DBSession } from '$lib/db/session';
import type { Node } from 'neo4j-driver';
import type { StorylineChapterResponse } from '$lib/nodes/digital-products/storyline';
import { Repository } from '$lib/repositories/repository';
import { BookHasChapterRel } from '$lib/nodes/digital-products/book';
import {
	ChapterPrecedesChapterRel,
	type ChapterNode,
	type ChapterResponse
} from '$lib/nodes/digital-products/chapter';

export class ChaptersRepository extends Repository {
	private _storylineID?: string;

	constructor() {
		super();
	}

	storylineID(storylineID: string): ChaptersRepository {
		this._storylineID = storylineID;
		return this;
	}

	async getAll(limit?: number, skip?: number): Promise<ChapterResponse[]> {
		const query = `
            OPTIONAL MATCH
				(storyline:Storyline ${this._storylineID ? `{id:'${this._storylineID}'}` : ``})-
					[:${BookHasChapterRel.label}]->
				(headChapter:Chapter {head: true})
			OPTIONAL MATCH 
				p = (headChapter)-
						[:${ChapterPrecedesChapterRel.label}*0..]->
					(chapter:Chapter)
			WHERE 
				NOT EXISTS((chapter)-[:${ChapterPrecedesChapterRel.label}]->())
				AND EXISTS((storyline)-[:${BookHasChapterRel.label}]-(chapter))
			RETURN nodes(p) as chapters
			${skip ? `SKIP ${skip}` : ''}
			${limit ? `LIMIT ${limit}` : ''}
		`;

		const session = new DBSession();
		const result = await session.executeRead(query);

		const resultNodes = result.records[0].get('chapters');
		const chapters: ChapterResponse[] = [];

		if (resultNodes) {
			resultNodes.forEach((node: ChapterNode) => {
				const chapterResponse = { chapter: node };
				chapters.push(chapterResponse);
			});
		}

		return new Promise<ChapterResponse[]>((resolve) => {
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
