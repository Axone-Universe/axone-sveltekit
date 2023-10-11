import { label, type StorylineProperties } from '$lib/properties/storyline';
import mongoose, { Schema, model, type PipelineStage, type ClientSession } from 'mongoose';
import { label as BookLabel } from '$lib/properties/book';
import { label as UserLabel } from '$lib/properties/user';
import { label as ChapterLabel } from '$lib/properties/chapter';
import {
	addDeletePermissionFilter,
	addPermissionsPipeline,
	addRestrictionsPipeline,
	addUpdatePermissionFilter,
	permissionSchema
} from './permission';

export const storylineSchema = new Schema<StorylineProperties>({
	_id: { type: String, required: true },
	main: { type: Boolean, required: true },
	book: { type: String, ref: BookLabel, required: true },
	user: { type: String, ref: UserLabel, required: true },
	chapters: [{ type: String, ref: ChapterLabel }],
	published: Boolean,
	permissions: { type: Map, of: permissionSchema },
	title: String,
	description: String,
	imageURL: String,
	cumulativeRating: { type: Number, default: 0 },
	numRatings: { type: Number, default: 0 }
});

interface StorylineMethods extends StorylineProperties {
	addChapter: (chapterID: string, session: ClientSession) => Promise<void>;
}

storylineSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	populate(pipeline);
	addPermissionsPipeline(userID, pipeline);
	addRestrictionsPipeline(userID, pipeline, 'books', 'book');
	next();
});

storylineSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addDeletePermissionFilter(userID, filter);
	this.setQuery(updatedFilter);

	next();
});

storylineSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		const updatedFilter = addUpdatePermissionFilter(userID, filter);
		this.setQuery(updatedFilter);

		next();
	}
);

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
	? model<StorylineMethods>(label)
	: model<StorylineMethods>(label, storylineSchema);
