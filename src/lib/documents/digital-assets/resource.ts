import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import type { ResourceProperties } from '$lib/properties/resource';
import { Resource } from '$lib/models/resource';
import type mongoose from 'mongoose';
import { type ResourceType } from '$lib/util/types';

export class ResourceBuilder extends DocumentBuilder<HydratedDocument<ResourceProperties>> {
	private _sessionUserID?: string;
	private readonly _resourceProperties: ResourceProperties;

	constructor(id?: string) {
		super();
		this._resourceProperties = {
			...{ _id: id ? id : ulid() }
		};
	}

	chapterID(chapterID: string): ResourceBuilder {
		this._resourceProperties.chapter = chapterID;
		return this;
	}

	userID(userID: string): ResourceBuilder {
		this._resourceProperties.user = userID;
		return this;
	}

	title(title: string): ResourceBuilder {
		this._resourceProperties.title = title;
		return this;
	}

	description(description: string): ResourceBuilder {
		this._resourceProperties.description = description;
		return this;
	}

	type(type: ResourceType): ResourceBuilder {
		this._resourceProperties.type = type;
		return this;
	}

	src(src: string): ResourceBuilder {
		this._resourceProperties.src = src;
		return this;
	}

	alt(alt: string): ResourceBuilder {
		this._resourceProperties.alt = alt;
		return this;
	}

	metadata(metadata: object): ResourceBuilder {
		this._resourceProperties.metadata = metadata;
		return this;
	}

	sessionUserID(sessionUserID: string): ResourceBuilder {
		this._sessionUserID = sessionUserID;
		return this;
	}

	async update(): Promise<HydratedDocument<ResourceProperties>> {
		if (!this._resourceProperties._id)
			throw new Error('Must provide a resourceID to update the resource.');

		const resource = await Resource.findOneAndUpdate(
			{ _id: this._resourceProperties._id },
			this._resourceProperties,
			{ new: true }
		);

		return resource;
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		if (!this._resourceProperties._id)
			throw new Error('Must provide a resource ID to delete the resource.');

		let result = {};

		result = await Resource.deleteOne(
			{ _id: this._resourceProperties._id },
			{ userID: this._sessionUserID }
		);

		return result as mongoose.mongo.DeleteResult;
	}

	async build(): Promise<HydratedDocument<ResourceProperties>> {
		if (!this._resourceProperties.user)
			throw new Error('Must provide a user ID to build the resource.');

		const resource = new Resource(this._resourceProperties);
		await resource.save();

		return resource;
	}
}
