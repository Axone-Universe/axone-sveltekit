import { Integer, int, type QueryResult } from 'neo4j-driver';
import type { Dict } from 'neo4j-driver-core/types/record';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import type { UserNode } from '$lib/nodes/base/NodeTypes';
import type { UserProperties } from '$lib/nodes/base/NodeProperties';
import type { INode } from '$lib/nodes/base/INode';

export class Author implements UserNode, INode {
	identity: Integer;
	labels: string[] = ['User', 'Author'];
	properties: UserProperties;
	elementId: string;

	constructor(properties: UserProperties) {
		this.identity = int(0);
		this.properties = properties;
		this.elementId = '0';
	}

	/**
	 * Creates book AND creator nodes having the CREATED relationship.
	 * This should be an atomic transaction because every book should have a creator.
	 * @returns
	 */
	create<T extends Dict>(): Promise<QueryResult<T>> {
		const session = new DBSession();

		const properties = stringifyObject(this.properties);
		const cypherLabels = this.labels.join(':');

		const cypher = `CREATE (user:${cypherLabels} ${properties}) SET user.id = toString(id(user)) RETURN user{.*} as properties`;
		return session.executeWrite<T>(cypher);
	}

	propertyFilter = (object: any, property: string) => {
		throw new Error('Method not implemented.');
	};

	toString(): string {
		throw new Error('Method not implemented.');
	}
}
