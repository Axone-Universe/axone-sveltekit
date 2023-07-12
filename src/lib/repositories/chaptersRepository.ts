import { DBSession } from '$lib/db/session';
import type { Record } from 'neo4j-driver';
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
	private _toChapterID?: string;

	constructor() {
		super();
	}

	storylineID(storylineID: string): ChaptersRepository {
		this._storylineID = storylineID;
		return this;
	}

	toChapterID(toChapterID: string): ChaptersRepository {
		this._toChapterID = toChapterID;
		return this;
	}

	/**
	 * You must specify the chapter to end on otherwise all sub-paths for the storyline will be returned
	 * In the where statement, we end at the leaf chapter or a specified _toChapterID
	 * @param limit
	 * @param skip
	 * @returns
	 */
	async getAll(limit?: number, skip?: number): Promise<ChapterResponse[]> {
		const query = `
            OPTIONAL MATCH
				(storyline:Storyline ${this._storylineID ? `{id:'${this._storylineID}'}` : ``})-
					[:${BookHasChapterRel.label}]->
				(headChapter:Chapter) 
				WHERE NOT EXISTS(()-[:${ChapterPrecedesChapterRel.label}]->(headChapter))
			OPTIONAL MATCH 
				p = (headChapter)-
						[:${ChapterPrecedesChapterRel.label}*0..]->
					(tailChapter)
				WHERE EXISTS((storyline)-[:${BookHasChapterRel.label}]->(tailChapter))
				${this._toChapterID ? `AND tailChapter.id ='${this._toChapterID}'` : ``}
			RETURN nodes(p) as chapters
			${skip ? `SKIP ${skip}` : ''}
			${limit ? `LIMIT ${limit}` : ''}
		`;

		const session = new DBSession();
		const result = await session.executeRead(query);

		const resultRecords = result.records;
		let longestPathLength = 0;
		let longestPath: Record;

		resultRecords.forEach((record) => {
			const pathLength = record.get('chapters').length;
			if (pathLength > longestPathLength) {
				longestPathLength = pathLength;
				longestPath = record.get('chapters');
			}
		});

		const chapters: ChapterResponse[] = [];

		if (longestPath!) {
			longestPath.forEach((node: ChapterNode) => {
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
