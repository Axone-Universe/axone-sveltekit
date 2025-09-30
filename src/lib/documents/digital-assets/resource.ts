import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import type {
	ResourceCollection,
	ResourceLicense,
	ResourceProperties,
	ResourceType
} from '$lib/properties/resource';
import { Resource } from '$lib/models/resource';
import type mongoose from 'mongoose';
import type { UserProperties } from '$lib/properties/user';

export class ResourceBuilder extends DocumentBuilder<HydratedDocument<ResourceProperties>> {
	private _sessionUser?: UserProperties;
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

	license(license: ResourceLicense): ResourceBuilder {
		this._resourceProperties.license = license;
		return this;
	}

	alt(alt: string): ResourceBuilder {
		this._resourceProperties.alt = alt;
		return this;
	}

	isListed(listed: boolean): ResourceBuilder {
		this._resourceProperties.isListed = listed;
		return this;
	}

	isTokenized(tokenized: boolean): ResourceBuilder {
		this._resourceProperties.isTokenized = tokenized;
		return this;
	}

	properties(properties: { name: string; value: string }[]): ResourceBuilder {
		this._resourceProperties.properties = properties;
		return this;
	}

	price(price: number): ResourceBuilder {
		this._resourceProperties.price = price;
		return this;
	}

	royalties(royalties: number): ResourceBuilder {
		if (royalties > 50) {
			throw new Error('Max royalties is 50% on the XRPL');
		}
		this._resourceProperties.royalties = royalties;
		return this;
	}

	nftCollection(nftCollection: ResourceCollection): ResourceBuilder {
		this._resourceProperties.nftCollection = nftCollection;
		return this;
	}

	nftId(nftId: string): ResourceBuilder {
		this._resourceProperties.nftId = nftId;
		return this;
	}

	nftWalletAddress(nftWalletAddress: string): ResourceBuilder {
		this._resourceProperties.nftWalletAddress = nftWalletAddress;
		return this;
	}

	sessionUser(sessionUser: UserProperties): ResourceBuilder {
		this._sessionUser = sessionUser;
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
			{ user: this._sessionUser }
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
