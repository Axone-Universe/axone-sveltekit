import { randomUUID } from 'crypto';

import type { Node, Integer, Relationship } from 'neo4j-driver';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import { NodeBuilder } from '$lib/nodes/nodeBuilder';
import { BookHasChapterRel, type BookHasStorylineResponse } from './book';
import type { CampaignNode } from '../campaigns/campaign';
import { BookHasStorylineRel } from './book';
import { UserAuthoredBookRel } from '$lib/nodes/user';
import type { NodeRelationship } from '$lib/util/types';
import type { S } from 'vitest/dist/types-ad1c3f45';
import type { ChapterNode } from './chapter';
import { ChapterPrecedesChapterRel } from '$lib/nodes/digital-products/chapter';

interface StorylineProperties {
	id: string;
	main: boolean;
	title?: string;
	description?: string;
	imageURL?: string;
}

export type StorylineNode = Node<Integer, StorylineProperties>;

export interface StorylineResponse {
	storyline: StorylineNode;
	chapters: ChapterNode[];
}

export const StorylineGenreRelationship: NodeRelationship = {
	name: 'in_genre',
	label: 'IN_GENRE'
};

export type SubmittedTo = Relationship<
	Integer,
	{
		date: string;
	}
>;

export interface StorylineChapterResponse {
	storyline: StorylineNode;
	chapter: ChapterNode;
}

export class StorylineBuilder extends NodeBuilder<BookHasStorylineResponse> {
	private readonly _storylineProperties: StorylineProperties;
	private _userID?: string;
	private _bookID?: string;
	// If a storyline has no parent it is the default storyline
	private _parentStorylineID?: string;
	private _branchOffChapterID?: string;

	constructor(id?: string) {
		super();
		this._storylineProperties = {
			id: id ? id : randomUUID(),
			main: false
		};
		this.labels(['Storyline']);
	}

	title(title: string): StorylineBuilder {
		this._storylineProperties.title = title;
		return this;
	}

	main(main: boolean): StorylineBuilder {
		this._storylineProperties.main = main;
		return this;
	}

	description(description: string): StorylineBuilder {
		this._storylineProperties.description = description;
		return this;
	}

	userID(userID: string): StorylineBuilder {
		this._userID = userID;
		return this;
	}

	bookID(bookID: string): StorylineBuilder {
		this._bookID = bookID;
		return this;
	}

	parentStorylineID(parentStorylineID: string): StorylineBuilder {
		this._parentStorylineID = parentStorylineID;
		return this;
	}

	branchOffChapterID(branchOffChapterID: string): StorylineBuilder {
		this._branchOffChapterID = branchOffChapterID;
		return this;
	}

	imageURL(imageURL: string): StorylineBuilder {
		this._storylineProperties.imageURL = imageURL;
		return this;
	}

	/**
	 * If a parent storyline is provided, the new storyline will link to all the parent's chapters
	 *      UP TO the branch-off chapter which should be specified as well.
	 * @returns
	 */
	async build(): Promise<BookHasStorylineResponse> {
		if (!this._userID) throw new Error('Must provide userID of author to build storyline.');
		if (!this._bookID) throw new Error('Must provide bookID of book to build storyline.');
		if (this._parentStorylineID && !this._branchOffChapterID)
			throw new Error(
				'Must provide the chapter to branch off from if parent storyline is specified'
			);

		const properties = stringifyObject(this._storylineProperties);

		const labels = this._labels.join(':');

		const query = `
			MERGE (storyline:${labels} {id: '${this._storylineProperties.id}'})
			SET storyline = ${properties}
			WITH storyline
			MATCH (user:User) WHERE user.id='${this._userID}'
            MATCH (book:Book) WHERE book.id='${this._bookID}'
			MERGE (user)-[${UserAuthoredBookRel.name}:${UserAuthoredBookRel.label}]->(storyline)
            MERGE (book)-[${BookHasStorylineRel.name}:${BookHasStorylineRel.label}]->(storyline)
            ${
							this._parentStorylineID
								? `
                WITH book, storyline
                MATCH (branchOffChapter:Chapter {id:'${this._branchOffChapterID}'})
                OPTIONAL MATCH 
                    (parentStoryline:Storyline {id:'${this._parentStorylineID}'})-
                        [:${BookHasChapterRel.label}]->
                    (headChapter:Chapter)
				WHERE 
					NOT EXISTS(()-[:${ChapterPrecedesChapterRel.label}]->(headChapter))
                OPTIONAL MATCH p = 
                    (headChapter)-
                        [:${ChapterPrecedesChapterRel.label}*0..]->
                    (branchOffChapter)
                WHERE
                    EXISTS ((parentStoryline)-[:${BookHasChapterRel.label}]-(branchOffChapter))
                WITH book, storyline, nodes(p) as parentChapters
                FOREACH (n IN parentChapters | MERGE (storyline)-[:${BookHasChapterRel.label} {created:false}]->(n))`
								: ``
						}
            RETURN book, storyline
		`;

		const session = new DBSession();
		const result = await session.executeWrite<BookHasStorylineResponse>(query);

		return result.records[0].toObject();
	}
}
