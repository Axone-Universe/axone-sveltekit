import { label, type StorylineProperties } from '$lib/shared/storyline';
import mongoose, { Schema, model, type PipelineStage } from 'mongoose';
import { label as BookLabel } from '$lib/shared/book';
import { label as UserLabel } from '$lib/shared/user';
import { label as ChapterLabel } from '$lib/shared/chapter';
import {
	addReadPermissionFilter,
	addDeletePermissionFilter,
	addUpdatePermissionFilter,
	permissionSchema
} from './permission';

export const storylineSchema = new Schema<StorylineProperties>({
	_id: { type: String, required: true },
	main: { type: Boolean, required: true },
	book: { type: String, ref: BookLabel, required: true },
	user: { type: String, ref: UserLabel, required: true },
	chapters: [{ type: String, ref: ChapterLabel }],
	permissions: { type: Map, of: permissionSchema },
	title: String,
	description: String,
	imageURL: String
});

storylineSchema.pre(['find', 'findOne'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	throw new Error('Please use aggregate.');
	// const updatedFilter = addReadPermissionFilter(userID, filter);
	// this.setQuery(updatedFilter);

	// this.populate({ path: 'user chapters permissions.$*.user', options: { userID: userID } });
	next();
});

storylineSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	// add populate pipeline

	// const updatedFilter = addReadPermissionFilter(userID, filter);
	// this.setQuery(updatedFilter);

	populate(pipeline);
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

	pipeline.push({
		$lookup: { from: 'chapters', localField: 'chapters', foreignField: '_id', as: 'chapters' }
	});

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

export const Storyline =
	mongoose.models[label] || model<StorylineProperties>(label, storylineSchema);
