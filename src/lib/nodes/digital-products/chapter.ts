import { randomUUID } from 'crypto';

import type { Node, Integer } from 'neo4j-driver';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import { NodeBuilder } from '$lib/nodes/nodeBuilder';
import { UserAuthoredBookRel } from '$lib/nodes/user';
import { BookHasChapterRel } from './book';
import type { StorylineChapterResponse } from './storyline';
import type { NodeRelationship } from '$lib/util/types';
import type { DeltaNode } from '../digital-assets/delta';
import type { Stats } from 'neo4j-driver-core';

export interface ChapterProperties {
	id: string;
	title?: string;
	description?: string;
	deltaID?: string;
}

export type ChapterNode = Node<Integer, ChapterProperties>;

export interface ChapterResponse {
	chapter: ChapterNode;
	delta?: DeltaNode;
	deltaOps?: string;
}

export const ChapterInStorylineRel: NodeRelationship = {
	name: 'in',
	label: 'IN'
};

export const ChapterPrecedesChapterRel: NodeRelationship = {
	name: 'precedes',
	label: 'PRECEDES'
};

export const ChapterHasDeltaRelationship: NodeRelationship = {
	name: 'has_delta',
	label: 'HAS_DELTA'
};

export class ChapterBuilder extends NodeBuilder<StorylineChapterResponse> {
	private readonly _chapterProperties: ChapterProperties;
	private _prevChapterID?: string;
	private _userID?: string;
	private _bookID?: string;
	private _storylineID?: string;

	constructor(id?: string) {
		super();
		this._chapterProperties = {
			id: id ? id : randomUUID()
		};
		this.labels(['Chapter']);
	}

	title(title: string): ChapterBuilder {
		this._chapterProperties.title = title;
		return this;
	}

	description(description: string): ChapterBuilder {
		this._chapterProperties.description = description;
		return this;
	}

	userID(userID: string): ChapterBuilder {
		this._userID = userID;
		return this;
	}

	storylineID(storylineID: string): ChapterBuilder {
		this._storylineID = storylineID;
		return this;
	}

	bookID(bookID: string): ChapterBuilder {
		this._bookID = bookID;
		return this;
	}

	prevChapterID(prevChapterID: string) {
		this._prevChapterID = prevChapterID;
		return this;
	}

	/**
	 * Don't use DETACH DELETE
	 * Always delete/redirect relationships by name then delete the node.
	 * @returns
	 */
	async delete(): Promise<Stats> {
		const labels = this._labels.join(':');

		// order matters here. DISTINCT seems not to work inside APOC procedures
		// first redirect the relationships and then do the deletions
		const query = `
            MATCH (chapter:${labels} {id: '${this._chapterProperties.id}'})
			OPTIONAL MATCH (prevChapter:${labels})-[prevChapter_rel:${ChapterPrecedesChapterRel.label}]->(chapter)
			OPTIONAL MATCH (nextChapter:${labels})<-[nextChapter_rel:${ChapterPrecedesChapterRel.label}]-(chapter)

			WITH DISTINCT chapter, prevChapter_rel, nextChapter, nextChapter_rel
			CALL apoc.do.when(
				prevChapter_rel IS NOT NULL AND nextChapter IS NOT NULL,
				'
					CALL apoc.refactor.to(prevChapter_rel, nextChapter) YIELD output RETURN output
				',
				'
					DELETE prevChapter_rel RETURN NULL
				',
				{prevChapter_rel:prevChapter_rel, nextChapter:nextChapter}
			)
			YIELD value
			
			MATCH (user)-[user_rel:${UserAuthoredBookRel.label}]->(chapter)
			MATCH (storyline)-[storyline_rel:${BookHasChapterRel.label}]->(chapter)
            MATCH (book)-[book_rel:${BookHasChapterRel.label}]->(chapter)
			OPTIONAL MATCH (chapter)-[delta_rel:${ChapterHasDeltaRelationship.label}]->(delta)

			DELETE user_rel, storyline_rel, book_rel, nextChapter_rel, delta_rel
			DELETE delta, chapter`;

		const session = new DBSession();
		const result = await session.executeWrite(query);

		console.log(query);
		const stats = result.summary.updateStatistics.updates();
		return stats;
	}

	async update(): Promise<ChapterResponse> {
		const properties = stringifyObject(this._chapterProperties);
		const labels = this._labels.join(':');

		const query = `
            MATCH (chapter:${labels} {id: '${this._chapterProperties.id}'})
            SET chapter += ${properties}
            return chapter`;

		const session = new DBSession();
		const result = await session.executeWrite<ChapterResponse>(query);

		return result.records[0].toObject();
	}

	async build(): Promise<StorylineChapterResponse> {
		if (!this._storylineID) throw new Error('Must provide a storylineID to build the chapter.');
		if (!this._bookID) throw new Error('Must provide bookID of book to build chapter.');

		const properties = stringifyObject(this._chapterProperties);

		const labels = this._labels.join(':');

		const query = `
			MERGE (chapter:${labels} {id: '${this._chapterProperties.id}'})
			SET chapter = ${properties}
			WITH chapter
			MATCH (storyline:Storyline) WHERE storyline.id='${this._storylineID}'
            MATCH (book:Book) WHERE book.id='${this._bookID}'
            MATCH (user:User) WHERE user.id='${this._userID}'
            MERGE (user)-[${UserAuthoredBookRel.name}:${UserAuthoredBookRel.label}]->(chapter)
			MERGE (storyline)-[:${BookHasChapterRel.label} {created:true}]->(chapter)
            MERGE (book)-[:${BookHasChapterRel.label}]->(chapter)
            ${
							this._prevChapterID
								? `
                WITH storyline, chapter
                MATCH (prevChapter:Chapter {id:'${this._prevChapterID}'})
                MERGE (prevChapter)-[${ChapterPrecedesChapterRel.name}:${ChapterPrecedesChapterRel.label}]->(chapter)`
								: ''
						}
			RETURN storyline, chapter
		`;

		const session = new DBSession();
		const result = await session.executeWrite<StorylineChapterResponse>(query);

		return result.records[0].toObject();
	}
}
