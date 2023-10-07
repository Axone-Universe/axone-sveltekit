import { DocumentBuilder } from './documentBuilder';
import type { HydratedDocument } from 'mongoose';
import { User } from '$lib/models/user';
import type { UserProperties, UserLabel } from '$lib/properties/user';
import type { Genre } from '$lib/properties/genre';
import {
	DEFAULT as DefaultReadingList,
	type ReadingListProperties
} from '$lib/properties/readingList';
import { record } from 'zod';

export class UserBuilder extends DocumentBuilder<HydratedDocument<UserProperties>> {
	private readonly _userProperties: UserProperties;

	constructor(id?: string) {
		super();
		this._userProperties = {
			_id: id ? id : '',
			readingLists: []
		};
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

	email(email: string): UserBuilder {
		this._userProperties.email = email;
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

	genres(genres: Genre[]): UserBuilder {
		this._userProperties.genres = genres;
		return this;
	}

	labels(labels: UserLabel[]): UserBuilder {
		this._userProperties.labels = labels;
		return this;
	}

	readingLists(readingLists: HydratedDocument<ReadingListProperties>[]) {
		this._userProperties.readingLists = readingLists;
		return this;
	}

	async update(): Promise<HydratedDocument<UserProperties>> {
		await User.findOneAndUpdate({ _id: this._userProperties._id }, this._userProperties);

		const newUser = await User.aggregate([
			{
				$match: {
					_id: this._userProperties._id
				}
			}
		])
			.cursor()
			.next();

		return newUser;
	}

	async build(): Promise<HydratedDocument<UserProperties>> {
		if (this._userProperties._id === '') throw new Error('Must provide userID to build user.');

		// Also create the default reading lists
		for (const readingList of DefaultReadingList) {
			const readingListProperties: ReadingListProperties = { title: readingList, books: {} };

			this._userProperties.readingLists?.push(
				readingListProperties as HydratedDocument<ReadingListProperties>
			);
		}

		const user = new User(this._userProperties);
		await user.save();

		const newUser = await User.aggregate([
			{
				$match: {
					_id: this._userProperties._id
				}
			}
		])
			.cursor()
			.next();

		return newUser;
	}
}
