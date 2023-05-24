import { randomUUID } from 'crypto';

import type { Node, Integer } from 'neo4j-driver';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import { NodeBuilder } from '$lib/nodes/nodeBuilder';
import type { UserAuthoredBookResponse } from '$lib/nodes/user';

interface BookProperties {
	id: string;
	title?: string;
}

export type BookNode = Node<Integer, BookProperties>;

export interface BookResponse {
	book: BookNode;
}

export class BookBuilder extends NodeBuilder<UserAuthoredBookResponse> {
	private readonly _bookProperties: BookProperties;
	private readonly _userID: { id?: string };

	constructor() {
		super();
		this._bookProperties = {
			id: randomUUID()
		};
		this.labels(['Book']);
		this._userID = {};
	}

	// TODO: remove? We shouldn't ever be setting the ID anyway
	id(id: string): BookBuilder {
		this._bookProperties.id = id;
		return this;
	}

	title(title: string): BookBuilder {
		this._bookProperties.title = title;
		return this;
	}

	userID(userID: string): BookBuilder {
		this._userID.id = userID;
		return this;
	}

	async build(): Promise<UserAuthoredBookResponse> {
		if (!this._userID.id) throw new Error('Must provide userID of author to build book.');

		// TODO: check if undefined values are still stringified or just missing (need latter)
		const properties = stringifyObject(this._bookProperties);
		const labels = this._labels.join(':');

		const query = `
			MATCH (user:User) WHERE user.id='${this._userID.id}'
			CREATE (book:${labels} ${properties})
			MERGE (user)-[authored:AUTHORED]->(book)
			RETURN user, authored, book
		`;

		const session = new DBSession();
		const result = await session.executeWrite<UserAuthoredBookResponse>(query);

		return result.records[0].toObject();
	}
}
