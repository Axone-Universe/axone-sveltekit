import { label, type StorylineProperties } from '$lib/properties/storyline';
import mongoose, { Schema, model, type PipelineStage } from 'mongoose';
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
	cumulativeRating: { type: Number, default: 0},
	numRatings: { type: Number, default: 0 }
});

storylineSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

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
	? model<StorylineProperties>(label)
	: model<StorylineProperties>(label, storylineSchema);
