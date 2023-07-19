import { DocumentBuilder } from './documentBuilder';
import type { HydratedDocument } from 'mongoose';
import { User } from '$lib/models/user';
import type { UserProperties, Users } from '$lib/shared/user';
import type { Genres } from '$lib/shared/genres';

export class UserBuilder extends DocumentBuilder<HydratedDocument<UserProperties>> {
	private readonly _userProperties: UserProperties;

	constructor(id?: string) {
		super();
		this._userProperties = {
			_id: id ? id : ''
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

	genres(genres: Genres): UserBuilder {
		this._userProperties.genres = genres;
		return this;
	}

	labels(labels: Users): UserBuilder {
		this._userProperties.labels = labels;
		return this;
	}

	async update(): Promise<HydratedDocument<UserProperties>> {
		const user = await User.findOneAndUpdate(
			{ _id: this._userProperties._id },
			this._userProperties,
			{ new: true }
		);

		return user;
	}

	async build(): Promise<HydratedDocument<UserProperties>> {
		if (this._userProperties._id === '') throw new Error('Must provide userID to build user.');

		const user = new User(this._userProperties);
		await user.save();

		return user;
	}
}
