import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import mongoose, { startSession } from 'mongoose';
import type { StorylineProperties } from '$lib/properties/storyline';
import { Storyline } from '$lib/models/storyline';
import type { PermissionProperties } from '$lib/properties/permission';
import { Chapter } from '$lib/models/chapter';

export class StorylineBuilder extends DocumentBuilder<HydratedDocument<StorylineProperties>> {
	private readonly _storylineProperties: StorylineProperties;
	private _userID?: string;
	private _bookID?: string;
	// If a storyline has no parent it is the default storyline
	private _parentStorylineID?: string;
	private _branchOffChapterID?: string;
	private _sessionUserID?: string;

	constructor(id?: string) {
		super();
		this._storylineProperties = {
			_id: id ? id : ulid(),
			main: false,
			permissions: {},
			cumulativeRating: 0,
			numRatings: 0
		};
	}

	title(title: string): StorylineBuilder {
		this._storylineProperties.title = title;
		return this;
	}

	main(main: boolean): StorylineBuilder {
		this._storylineProperties.main = main;
		return this;
	}

	description(description: string): StorylineBuilder {
		this._storylineProperties.description = description;
		return this;
	}

	userID(userID: string): StorylineBuilder {
		this._userID = userID;

		this._storylineProperties.user = userID;

		return this;
	}

	bookID(bookID: string): StorylineBuilder {
		this._bookID = bookID;

		this._storylineProperties.book = bookID;

		return this;
	}

	parentStorylineID(parentStorylineID: string): StorylineBuilder {
		this._parentStorylineID = parentStorylineID;
		return this;
	}

	branchOffChapterID(branchOffChapterID: string): StorylineBuilder {
		this._branchOffChapterID = branchOffChapterID;
		return this;
	}

	imageURL(imageURL: string): StorylineBuilder {
		this._storylineProperties.imageURL = imageURL;
		return this;
	}

	properties() {
		return this._storylineProperties;
	}

	permissions(permissions: Record<string, HydratedDocument<PermissionProperties>>) {
		this._storylineProperties.permissions = permissions;
		return this;
	}

	archived(archived: boolean) {
		this._storylineProperties.archived = archived;
		return this;
	}

	sessionUserID(sessionUserID: string): StorylineBuilder {
		this._sessionUserID = sessionUserID;
		return this;
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		const session = await mongoose.startSession();

		let result = {};

		await session.withTransaction(async () => {
			const storyline = await Storyline.aggregate(
				[
					{
						$match: {
							_id: this._storylineProperties._id
						}
					}
				],
				{
					userID: this._sessionUserID
				}
			)
				.cursor()
				.next();

			const children = storyline.children;
			if (children && children.length !== 0) {
				// re-assign children to the parent
				const parents = await Storyline.aggregate([
					{
						$match: {
							children: this._storylineProperties._id
						}
					}
				]);

				for (const parent of parents) {
					parent.children = parent.children.concat(children);

					await Storyline.findOneAndUpdate({ _id: parent._id }, parent, {
						userID: this._sessionUserID,
						session: session
					});
				}
			}

			result = await Storyline.deleteOne(
				{ _id: this._storylineProperties._id },
				{ session: session, userID: this._sessionUserID }
			);

			return result;
		});
		session.endSession();

		return result as mongoose.mongo.DeleteResult;
	}

	async update(): Promise<HydratedDocument<StorylineProperties>> {
		const storyline = await Storyline.findOneAndUpdate(
			{ _id: this._storylineProperties._id },
			this._storylineProperties,
			{
				new: true,
				userID: this._sessionUserID
			}
		);

		if (storyline) {
			return storyline;
		}

		throw new Error("Couldn't update storyline");
	}

	async setArchived(ids: string[]): Promise<boolean> {
		const session = await startSession();
		let acknowledged = false;

		try {
			await session.withTransaction(async () => {
				acknowledged = (
					await Storyline.updateMany(
						{ _id: { $in: ids }, user: this._storylineProperties.user },
						{ archived: this._storylineProperties.archived },
						{
							userID: this._sessionUserID,
							session
						}
					)
				).acknowledged;

				if (acknowledged) {
					await Chapter.updateMany(
						{ storyline: { $in: ids }, user: this._storylineProperties.user },
						{ archived: this._storylineProperties.archived },
						{
							userID: this._sessionUserID,
							session
						}
					);
				}
			});
		} finally {
			session.endSession();
		}

		return acknowledged;
	}

	/**
	 * If a parent storyline is provided, the new storyline will link to all the parent's chapters
	 *      UP TO the branch-off chapter which should be specified as well.
	 * @returns
	 */
	async build(): Promise<HydratedDocument<StorylineProperties>> {
		if (!this._userID) throw new Error('Must provide userID of author to build storyline.');
		if (!this._bookID) throw new Error('Must provide bookID of book to build storyline.');
		if (this._parentStorylineID && !this._branchOffChapterID) {
			throw new Error(
				'Must provide the chapter to branch off from if parent storyline is specified'
			);
		}

		const storyline = new Storyline(this._storylineProperties);

		// get the parent chapter ids
		// we assume they are already sorted in correct order by the push
		if (this._parentStorylineID) {
			const parentStoryline = await Storyline.aggregate(
				[
					{
						$match: {
							_id: this._parentStorylineID
						}
					}
				],
				{
					userID: this._userID
				}
			)
				.cursor()
				.next();

			for (const chapter of parentStoryline.chapters) {
				const chapterID = typeof chapter === 'string' ? chapter : chapter._id;

				storyline.chapters?.push(chapterID);
				if (chapterID === this._branchOffChapterID) {
					break;
				}
			}
		}

		await storyline.save();

		return storyline;
	}
}
