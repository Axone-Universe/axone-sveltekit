import { label, type StorylineProperties } from '$lib/properties/storyline';
import mongoose, { Schema, model, type PipelineStage, type ClientSession } from 'mongoose';
import { label as BookLabel } from '$lib/properties/book';
import { label as UserLabel } from '$lib/properties/user';
import { label as ChapterLabel } from '$lib/properties/chapter';
import {
	addUserPermissionPipeline,
	addViewRestrictionPipeline,
	addOwnerUpdateRestrictionFilter,
	permissionSchema,
	addArchivedRestrictionFilter,
	setUpdateDate
} from './permission';
import { Book } from './book';
import { GENRES } from '$lib/properties/genre';

interface ExtendedStorylineProperties extends StorylineProperties {
	addChapter: (chapterID: string, session: ClientSession) => Promise<void>;
	deleteChapter: (chapterID: string, session: ClientSession) => Promise<void>;
}

export const storylineSchema = new Schema<ExtendedStorylineProperties>({
	_id: { type: String, required: true },
	main: { type: Boolean, required: true },
	book: { type: String, ref: BookLabel, required: true },
	user: { type: String, ref: UserLabel, required: true },
	chapters: [{ type: String, ref: ChapterLabel }],
	permissions: { type: Map, of: permissionSchema },
	tags: [{ type: String }],
	genres: [
		{
			type: String,
			enum: GENRES
		}
	],
	title: String,
	description: String,
	imageURL: String,
	cumulativeRating: { type: Number, default: 0 },
	numRatings: { type: Number, default: 0 },
	archived: { type: Boolean, default: false },
	createdAt: Date,
	updatedAt: Date
});

storylineSchema.index({ title: 'text', tags: 'text' });

storylineSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();
	const postPipeline = this.options.postPipeline ?? [];

	populate(pipeline);
	addUserPermissionPipeline(userID, pipeline);
	addViewRestrictionPipeline(userID, pipeline, 'books', 'book');

	for (const filter of postPipeline) {
		pipeline.push(filter);
	}

	next();
});

storylineSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addOwnerUpdateRestrictionFilter(userID, filter);
	this.setQuery(updatedFilter);

	next();
});

storylineSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		setUpdateDate(this.getUpdate());

		let updatedFilter = addOwnerUpdateRestrictionFilter(userID, filter);
		updatedFilter = addArchivedRestrictionFilter(updatedFilter);

		this.setQuery(updatedFilter);

		next();
	}
);

storylineSchema.pre('save', async function (next) {
	const userID = this.user as string;
	const bookID = this.book as string;

	this.createdAt = this.updatedAt = new Date();

	const book = await Book.aggregate(
		[
			{
				$match: {
					_id: bookID
				}
			}
		],
		{
			userID: userID
		}
	)
		.cursor()
		.next();

	if (book) {
		if (!book.userPermissions?.collaborate) {
			throw new Error('You have no permission to collaborate on the book');
		}

		if (book.archived) {
			throw new Error('This book is archived');
		}

		if (book.campaign) {
			if (Date.now() > book.campaign.endDate) {
				throw new Error('This campaign has ended. No more entries allowed');
			}
		}
	}

	next();
});

/**
 * Adding a chapter to storyline.chapters array cannot use findOneAndUpdate because of permission restrictions
 * Use this method instead, by
 * 1. getting the storyline using aggregate
 * 2. Creating model instance of Storyline from the returned object
 * 3. calling addChapter on the model instance
 * @param chapterID
 * @returns
 */
storylineSchema.methods.addChapter = async function (chapterID: string, session: ClientSession) {
	this.chapters.push(chapterID);
	await this.save({ session });
};

storylineSchema.methods.deleteChapter = async function (
	deleteChapterID: string,
	session: ClientSession
) {
	this.chapters = this.chapters.filter((chapterID: string) => chapterID !== deleteChapterID);
	await this.save({ session });
};

/**
 * Add fields you want to be populated by default here
 * @param query
 */
function populate(pipeline: PipelineStage[]) {
	pipeline.push(
		{
			$lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' }
		},
		{
			$unwind: {
				path: '$user',
				preserveNullAndEmptyArrays: true
			}
		}
	);

	pipeline.push(
		{
			$addFields: {
				permissionsArray: { $objectToArray: '$permissions' }
			}
		},
		{
			$lookup: {
				from: 'users',
				localField: 'permissionsArray.v.user',
				foreignField: '_id',
				as: 'permissionsUsers'
			}
		},
		{
			$unset: ['permissionsArray']
		}
	);
}

export const Storyline = mongoose.models[label]
	? model<ExtendedStorylineProperties>(label)
	: model<ExtendedStorylineProperties>(label, storylineSchema);
