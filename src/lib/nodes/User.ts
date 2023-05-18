import type { Integer, Node, Relationship } from 'neo4j-driver';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import type { BookNode } from '$lib/nodes/digital-products/book';
import { NodeBuilder } from '$lib/nodes/nodeBuilder';

interface UserProperties {
	id: string;
	name?: string;
	email?: string;
}

export type UserNode = Node<Integer, UserProperties>;

export type Authored = Relationship<
	Integer,
	{
		date: string;
	}
>;

export interface UserResponse {
	user: UserNode;
}

export interface UserAuthoredBookResponse {
	user: UserNode;
	authored: Authored;
	book: BookNode;
}

export class UserBuilder extends NodeBuilder<UserResponse> {
	private readonly _userProperties: UserProperties;

	constructor() {
		super();
		this._userProperties = {
			id: ''
		};
		this.labels(['User']);
	}

	// TODO: remove? We shouldn't ever be setting the ID anyway
	id(id: string): UserBuilder {
		this._userProperties.id = id;
		return this;
	}

	name(name: string): UserBuilder {
		this._userProperties.name = name;
		return this;
	}

	email(email: string): UserBuilder {
		this._userProperties.email = email;
		return this;
	}

	async build(): Promise<UserResponse> {
		if (this._userProperties.id === '') throw new Error('Must provide userID to build user.');

		const properties = stringifyObject(this._userProperties);
		const labels = this._labels.join(':');

		const query = `
			CREATE (user:${labels} ${properties})
			RETURN user
		`;

		const session = new DBSession();
		const result = await session.executeWrite<UserResponse>(query);

		return result.records[0].toObject();
	}
}
