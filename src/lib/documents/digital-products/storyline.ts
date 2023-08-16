import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import type { StorylineProperties } from '$lib/shared/storyline';
import { Storyline } from '$lib/models/storyline';
import type { PermissionProperties } from '$lib/shared/permission';

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
			main: false
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

	permissions(permissions: HydratedDocument<PermissionProperties>[]) {
		this._storylineProperties.permissions = permissions;
		return this;
	}

	sessionUserID(sessionUserID: string): StorylineBuilder {
		this._sessionUserID = sessionUserID;
		return this;
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
			const parentStoryline = await Storyline.findById(this._parentStorylineID, null, {
				userID: this._userID
			});
			for (const chapter of parentStoryline.chapters) {
				const chapterID = typeof chapter === 'string' ? chapter : chapter._id;

				storyline.chapters.push(chapterID);
				if (chapterID === this._branchOffChapterID) {
					break;
				}
			}
		}

		await storyline.save();

		return storyline;
	}
}
