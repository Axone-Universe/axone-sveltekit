import { randomUUID } from 'crypto';

import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import type { BookProperties } from '$lib/nodes/base/NodeProperties';
import type { Book, User } from '$lib/nodes/base/NodeTypes';
import type { QueryResult } from 'neo4j-driver';
import { Handler } from '../base/INode';
import type { Dict } from 'neo4j-driver-core/types/record';

interface CreateBookResponse extends Dict {
	book: Book;
	user: User;
}

export class BookHandler extends Handler {
	labels: string[] = ['Book'];
	properties: BookProperties;
	creatorID: string;

	id?: string;

	constructor(title: string, creatorID: string) {
		super();
		this.properties = { id: randomUUID(), title };
		this.creatorID = creatorID;
	}

	async create<CreateBookResponse extends Dict>(): Promise<QueryResult<CreateBookResponse>> {
		const stringifedProperties = stringifyObject(this.properties);
		const cypherLabels = this.labels.join(':');

		const cypher = `
			MATCH (user:User) WHERE user.id='${this.creatorID}'
			SET user:Author
			CREATE (book:${cypherLabels} ${stringifedProperties})
            MERGE (user)-[:CREATED]->(book)
            RETURN book, user
		`;

		const session = new DBSession();
		const result = await session.executeWrite<CreateBookResponse>(cypher);

		return result;
	}

	propertyFilter = (object: any, property: string) => {
		throw new Error('Method not implemented.');
	};

	toString(): string {
		throw new Error('Method not implemented.');
	}
}
