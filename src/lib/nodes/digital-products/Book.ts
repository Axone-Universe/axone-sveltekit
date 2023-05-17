import { randomUUID } from 'crypto';

import { Integer, int, type QueryResult } from 'neo4j-driver';
import type { Dict } from 'neo4j-driver-core/types/record';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import type { BookNode } from '$lib/nodes/base/NodeTypes';
import type { BookProperties, UserProperties } from '$lib/nodes/base/NodeProperties';
import type { INode } from '$lib/nodes/base/INode';

export class Book implements BookNode, INode {
	identity: Integer;
	labels: string[] = ['Book'];
	properties: BookProperties;
	elementId: string;
	creator: UserProperties;
	creatorID: string;

	constructor(properties: BookProperties, creatorID: string) {
		this.identity = int(0);
		this.properties = properties;
		this.creator = { id: '', name: '', email: '' };
		this.creatorID = creatorID;
		this.elementId = '0';
	}

	/**
	 * Creates book AND creator nodes having the CREATED relationship.
	 * This should be an atomic transaction because every book should have a creator.
	 * @returns
	 */
	create<T extends Dict>(): Promise<QueryResult<T>> {
		this.properties.id = randomUUID();
		const properties = stringifyObject(this.properties);

		const cypherLabels = this.labels.join(':');

		const cypher = `MATCH (user:User) WHERE user.id='${this.creatorID}'
			MERGE (book:${cypherLabels} ${properties}) 
            MERGE (user)-[:CREATED]->(book)
            RETURN book{.*} AS properties, user{.*} AS creator`;

		const session = new DBSession();
		return session.executeWrite<T>(cypher);
	}

	propertyFilter = (object: any, property: string) => {};

	toString(): string {
		throw new Error('Method not implemented.');
	}
}
