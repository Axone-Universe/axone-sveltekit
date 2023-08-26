import { label, type ChapterProperties } from '$lib/shared/chapter';
import mongoose, { Schema, model, type PipelineStage } from 'mongoose';
import { label as BookLabel } from '$lib/shared/book';
import { label as StorylineLabel } from '$lib/shared/storyline';
import { label as UserLabel } from '$lib/shared/user';
import { label as DeltaLabel } from '$lib/shared/delta';
import {
	addDeletePermissionFilter,
	addUpdatePermissionFilter,
	permissionSchema
} from './permission';

export const chapterSchema = new Schema<ChapterProperties>({
	_id: { type: String, required: true },
	book: { type: String, ref: BookLabel, required: true },
	storyline: { type: String, ref: StorylineLabel, required: true },
	user: { type: String, ref: UserLabel, required: true },
	delta: { type: String, ref: DeltaLabel },
	children: [{ type: String, ref: label }],
	published: Boolean,
	permissions: { type: Map, of: permissionSchema },
	title: String,
	description: String
});

chapterSchema.pre(['find', 'findOne'], function (next) {
	throw new Error('Please use aggregate.');
});

chapterSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	populate(pipeline);
	permissions(userID, pipeline);
	next();
});

chapterSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addDeletePermissionFilter(userID, filter);
	this.setQuery(updatedFilter);

	next();
});

chapterSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		const updatedFilter = addUpdatePermissionFilter(userID, filter);
		this.setQuery(updatedFilter);

		next();
	}
);

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

function permissions(userID: string, pipeline: PipelineStage[]) {
	// permissions
	pipeline.push(
		{
			$lookup: {
				from: 'storylines',
				localField: 'storyline',
				foreignField: '_id',
				as: 'storyline'
			}
		},
		{
			$unwind: {
				path: '$storyline',
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$match: {
				$or: [
					{ 'storyline.user': userID },
					{ 'storyline.published': true },
					{ ['storyline.permissions.' + userID]: { $exists: true } }
				]
			}
		}
	);

	pipeline.push({
		$addFields: {
			hasPermission: {
				$cond: [
					{
						$or: [
							{ $eq: ['$user._id', userID] },
							{ $eq: ['$published', true] }
							// { $ne: [['$permissions.' + userID], null] }
						]
					},
					true,
					false
				]
			}
		}
	});
}

export const Chapter = mongoose.models[label] || model<ChapterProperties>(label, chapterSchema);
