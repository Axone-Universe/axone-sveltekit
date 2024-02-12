import { DocumentBuilder } from './documentBuilder';
import type { HydratedDocument } from 'mongoose';
import { User } from '$lib/models/user';
import { type UserProperties, type UserLabel, DEFAULT_READING_LIST } from '$lib/properties/user';
import type { Genre } from '$lib/properties/genre';
import type {
	CreateDeleteReadingList,
	RenameReadingList,
	UpdateReadingList as UpdateReadingLists
} from '$lib/trpc/schemas/users';
import { Storyline } from '$lib/models/storyline';

export class UserBuilder extends DocumentBuilder<HydratedDocument<UserProperties>> {
	private readonly _userProperties: UserProperties;
	private _sessionUserID?: string;

	constructor(id?: string) {
		super();
		this._userProperties = {
			_id: id ? id : '',
			...(id ? { readingLists: new Map([[DEFAULT_READING_LIST, []]]) } : {})
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

	sessionUserID(sessionUserID: string): UserBuilder {
		this._sessionUserID = sessionUserID;
		return this;
	}

	async update(): Promise<HydratedDocument<UserProperties> | null> {
		const user = await User.findOneAndUpdate(
			{ _id: this._userProperties._id },
			this._userProperties,
			{ new: true, userID: this._sessionUserID }
		);

		return user;
	}

	async updateReadingLists(
		updateReadingLists: UpdateReadingLists
	): Promise<HydratedDocument<UserProperties> | null> {
		const maybeStoryline = await Storyline.findOne({
			_id: updateReadingLists.storylineID
		});

		if (maybeStoryline) {
			const user = await User.findById(this._userProperties._id);

			if (user) {
				for (const listName of user.readingLists!.keys()) {
					if (updateReadingLists.names.includes(listName)) {
						if (!user.readingLists!.get(listName)?.includes(updateReadingLists.storylineID)) {
							user.readingLists!.get(listName)!.push(updateReadingLists.storylineID);
						}
					} else {
						user.readingLists!.set(
							listName,
							user.readingLists!.get(listName)!.filter((v) => v !== updateReadingLists.storylineID)
						);
					}
				}

				const saved = await user.save();
				return saved;
			}
		}

		throw Error('storyline does not exist');
	}

	async createReadingList(
		createReadingList: CreateDeleteReadingList
	): Promise<HydratedDocument<UserProperties> | null> {
		const maybeUser = await User.findOne({
			_id: this._userProperties._id,
			[`readingLists.${createReadingList.name}`]: { $exists: true }
		});

		if (!maybeUser) {
			const user = await User.findOneAndUpdate(
				{ _id: this._userProperties._id },
				{
					$set: {
						[`readingLists.${createReadingList.name}`]: []
					}
				},
				{ new: true, userID: this._sessionUserID }
			);

			return user;
		}

		throw Error('duplicate key error');
	}

	async deleteReadingList(
		createReadingList: CreateDeleteReadingList
	): Promise<HydratedDocument<UserProperties> | null> {
		const user = await User.findOneAndUpdate(
			{ _id: this._userProperties._id },
			{
				$unset: {
					[`readingLists.${createReadingList.name}`]: []
				}
			},
			{ new: true, userID: this._sessionUserID }
		);

		return user;
	}

	async renameReadingList(
		renameReadingList: RenameReadingList
	): Promise<HydratedDocument<UserProperties> | null> {
		const user = await User.findOneAndUpdate(
			{ _id: this._userProperties._id },
			{
				$rename: {
					[`readingLists.${renameReadingList.oldName}`]: `readingLists.${renameReadingList.newName}`
				}
			},
			{ new: true, userID: this._sessionUserID }
		);

		return user!;
	}

	async build(): Promise<HydratedDocument<UserProperties>> {
		if (this._userProperties._id === '') throw new Error('Must provide userID to build user.');

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
