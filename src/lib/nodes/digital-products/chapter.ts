import { randomUUID } from 'crypto';

import type { Node, Integer } from 'neo4j-driver';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import { NodeBuilder } from '$lib/nodes/nodeBuilder';
import { UserAuthoredBookRel } from '$lib/nodes/user';
import { BookHasChapterRel } from './book';
import type { StorylineChapterResponse } from './storyline';
import type { NodeRelationship } from '$lib/util/types';

interface ChapterProperties {
	id: string;
	head: boolean;
	prevChapterID?: string;
	title?: string;
	description?: string;
	// content is the current state of the chapter
	content?: string;
	// deltas are the autosaved increments of the state
	// These should be merged into the content periodically on the UI in quill editor
	deltas?: string[];
}

export type ChapterNode = Node<Integer, ChapterProperties>;

export interface ChapterResponse {
	chapter: ChapterNode;
}

export const ChapterInStorylineRel: NodeRelationship = {
	name: 'in',
	label: 'IN'
};

export const ChapterPrecedesChapterRel: NodeRelationship = {
	name: 'precedes',
	label: 'PRECEDES'
};

export class ChapterBuilder extends NodeBuilder<StorylineChapterResponse> {
	private readonly _chapterProperties: ChapterProperties;
	private _userID?: string;
	private _bookID?: string;
	private _storylineID?: string;

	constructor() {
		super();
		this._chapterProperties = {
			head: true,
			id: randomUUID()
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
		this._chapterProperties.prevChapterID = prevChapterID;
		this._chapterProperties.head = false;
		return this;
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
							this._chapterProperties.prevChapterID
								? `
                WITH storyline, chapter
                MATCH (prevChapter:Chapter {id:'${this._chapterProperties.prevChapterID}'})
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
