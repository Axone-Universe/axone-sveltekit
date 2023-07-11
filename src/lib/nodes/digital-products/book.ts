import { randomUUID } from 'crypto';

import type { Node, Integer, Relationship } from 'neo4j-driver';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import { NodeBuilder } from '$lib/nodes/nodeBuilder';
import type { UserAuthoredBookResponse } from '$lib/nodes/user';
import type { CampaignNode } from '../campaigns/campaign';
import type { StorylineNode } from './storyline';
import { UserAuthoredBookRel } from '$lib/nodes/user';
import type { NodeRelationship } from '$lib/util/types';
import type { ChapterNode } from './chapter';

export interface BookProperties {
	id: string;
	title?: string;
	description?: string;
	imageURL?: string;
	genres?: string[];
	tags?: string[];
}

export type BookNode = Node<Integer, BookProperties>;

export interface BookResponse {
	book: BookNode;
}

export interface BookStorylineResponse {
	book: BookNode;
	storyline: StorylineNode;
}

export interface BookChapterResponse {
	book: BookNode;
	chapter: ChapterNode;
}

export const BookGenreRelationship: NodeRelationship = {
	name: 'in_genre',
	label: 'IN_GENRE'
};

export const BookHasStorylineRel: NodeRelationship = {
	name: 'has_storyline',
	label: 'HAS_STORYLINE'
};

export const BookHasChapterRel: NodeRelationship = {
	name: 'has_chapter',
	label: 'HAS_CHAPTER'
};

export type SubmittedTo = Relationship<
	Integer,
	{
		date: string;
	}
>;

export interface BookSubmittedToCampaignResponse {
	book: BookNode;
	submittedTo: SubmittedTo;
	campaign: CampaignNode;
}

export interface BookHasStorylineResponse {
	book: BookNode;
	storyline: StorylineNode;
}

export class BookBuilder extends NodeBuilder<UserAuthoredBookResponse> {
	private readonly _bookProperties: BookProperties;
	private readonly _userID: { id?: string };

	constructor(id?: string) {
		super();
		this._bookProperties = {
			id: id ? id : randomUUID()
		};
		this.labels(['Book']);
		this._userID = {};
	}

	title(title: string): BookBuilder {
		this._bookProperties.title = title;
		return this;
	}

	description(description: string): BookBuilder {
		this._bookProperties.description = description;
		return this;
	}

	userID(userID: string): BookBuilder {
		this._userID.id = userID;
		return this;
	}

	imageURL(imageURL: string): BookBuilder {
		this._bookProperties.imageURL = imageURL;
		return this;
	}

	genres(genres: string[]) {
		this._bookProperties.genres = genres;
		return this;
	}

	async build(): Promise<UserAuthoredBookResponse> {
		if (!this._userID.id) throw new Error('Must provide userID of author to build book.');

		const properties = stringifyObject(this._bookProperties);
		const genreNodes = stringifyObject(this._bookProperties.genres, {
			transform: (object, property, originalResult) => {
				return `(:Genre {name:${originalResult}})`;
			}
		})
			.replaceAll(/\[|\]/g, '')
			.replaceAll(',', 'MERGE');

		const labels = this._labels.join(':');

		const query = `
			MERGE (book:${labels} {id: '${this._bookProperties.id}'})
			SET book = ${properties}
			MERGE ${genreNodes}
			WITH book
			MATCH (user:User) WHERE user.id='${this._userID.id}'
			MERGE (user)-[${UserAuthoredBookRel.name}:${UserAuthoredBookRel.label}]->(book)
			WITH user, authored, book
			OPTIONAL MATCH (book)-[r:${BookGenreRelationship.label}]->(:Genre) DELETE r
			WITH user, authored, book
			MATCH (genre:Genre) WHERE genre.name IN book.genres
			CREATE (book)-[:${BookGenreRelationship.label}]->(genre)
			RETURN user, authored, book
		`;

		const session = new DBSession();
		const result = await session.executeWrite<UserAuthoredBookResponse>(query);

		return result.records[0].toObject();
	}
}
