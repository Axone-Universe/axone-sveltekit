import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import type { ReadingListProperties, Tag } from '$lib/properties/readingList';
import { ReadingList } from '$lib/models/readingList';
import type mongoose from 'mongoose';

export class ReadingListBuilder extends DocumentBuilder<HydratedDocument<ReadingListProperties>> {
	private _sessionUserID?: string;
	private readonly _readingListProperties: ReadingListProperties;

	constructor(id?: string) {
		super();
		this._readingListProperties = {
			_id: id ? id : ulid(),
			title: ''
		};
	}

	title(title: string): ReadingListBuilder {
		this._readingListProperties.title = title;
		return this;
	}

	sessionUserID(sessionUserID: string): ReadingListBuilder {
		this._sessionUserID = sessionUserID;
		return this;
	}

	async update(): Promise<HydratedDocument<ReadingListProperties>> {
		if (!this._readingListProperties._id)
			throw new Error('Must provide a readingListID to update the readingList.');

		const readingList = await ReadingList.findOneAndUpdate(
			{ _id: this._readingListProperties._id },
			this._readingListProperties,
			{ new: true }
		);

		return readingList;
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		if (!this._readingListProperties._id)
			throw new Error('Must provide a readingList ID to delete the readingList.');

		let result = {};

		result = await ReadingList.deleteOne(
			{ _id: this._readingListProperties._id },
			{ userID: this._sessionUserID }
		);

		return result as mongoose.mongo.DeleteResult;
	}

	async build(): Promise<HydratedDocument<ReadingListProperties>> {
		if (!this._readingListProperties.user)
			throw new Error('Must provide a user ID to build the readingList.');

		const readingList = new ReadingList(this._readingListProperties);
		await readingList.save();

		const newReadingList = await ReadingList.aggregate(
			[
				{
					$match: {
						_id: this._readingListProperties._id
					}
				}
			],
			{
				userID: this._sessionUserID
			}
		)
			.cursor()
			.next();

		return newReadingList;
	}
}
