import type { Integer, Node, Relationship } from 'neo4j-driver';
import stringifyObject from 'stringify-object';

import { DBSession } from '$lib/db/session';
import type { BookNode } from '$lib/nodes/digital-products/book';
import { NodeBuilder } from '$lib/nodes/nodeBuilder';

interface UserProperties {
	id: string;
	firstName?: string;
	lastName?: string;
	about?: string;
	imageURL?: string;
	facebook?: string;
	instagram?: string;
	twitter?: string;
	fictional?: string[];
	nonFictional?: string[];
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

	firstName(firstName: string): UserBuilder {
		this._userProperties.firstName = firstName;
		return this;
	}

	lastName(lastName: string): UserBuilder {
		this._userProperties.lastName = lastName;
		return this;
	}

	imageURL(imageURL: string): UserBuilder {
		this._userProperties.imageURL = imageURL;
		return this;
	}

	about(about: string): UserBuilder {
		this._userProperties.about = about;
		return this;
	}

	facebook(facebook: string): UserBuilder {
		this._userProperties.facebook = facebook;
		return this;
	}

	instagram(instagram: string): UserBuilder {
		this._userProperties.instagram = instagram;
		return this;
	}

	twitter(twitter: string): UserBuilder {
		this._userProperties.twitter = twitter;
		return this;
	}

	fictional(fictional: string[]): UserBuilder {
		this._userProperties.fictional = fictional;
		return this;
	}

	nonFictional(nonFictional: string[]): UserBuilder {
		this._userProperties.nonFictional = nonFictional;
		return this;
	}

	async build(): Promise<UserResponse> {
		if (this._userProperties.id === '') throw new Error('Must provide userID to build user.');

		const properties = stringifyObject(this._userProperties);
		const labels = this._labels.join(':');

		// TODO: find better way to replace all labels?
		const query = `
			MERGE (user:User {id: '${this._userProperties.id}'})
			SET user = ${properties}
			REMOVE user:User:Writer:Editor:Illustrator
			SET user:${labels}
			RETURN user
		`;

		const session = new DBSession();
		const result = await session.executeWrite<UserResponse>(query);

		return result.records[0].toObject();
	}
}
