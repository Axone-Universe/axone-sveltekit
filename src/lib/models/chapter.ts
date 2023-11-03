import { label, type ChapterProperties } from '$lib/properties/chapter';
import mongoose, { Schema, model, type PipelineStage } from 'mongoose';
import { label as BookLabel } from '$lib/properties/book';
import { label as StorylineLabel } from '$lib/properties/storyline';
import { label as UserLabel } from '$lib/properties/user';
import { label as DeltaLabel } from '$lib/properties/delta';
import {
	addUserPermissionPipeline,
	addReadRestrictionPipeline,
	addUpdateRestrictionPipeline,
	permissionSchema,
	addCollaborationRestrictionOnSave
} from './permission';
import { Storyline } from './storyline';

export const chapterSchema = new Schema<ChapterProperties>({
	_id: { type: String, required: true },
	book: { type: String, ref: BookLabel, required: true },
	storyline: { type: String, ref: StorylineLabel, required: true },
	user: { type: String, ref: UserLabel, required: true },
	delta: { type: String, ref: DeltaLabel },
	children: [{ type: String, ref: label }],
	permissions: { type: Map, of: permissionSchema },
	title: String,
	description: String,
	archived: { type: Boolean, default: false }
});

chapterSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

chapterSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const storylineID = this.options.storylineID;
	const pipeline = this.pipeline();

	populate(pipeline);
	addUserPermissionPipeline(userID, pipeline);
	addReadRestrictionPipeline(userID, pipeline, 'storylines', 'storyline', storylineID);
	next();
});

chapterSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addUpdateRestrictionPipeline(userID, filter);
	this.setQuery(updatedFilter);

	next();
});

chapterSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		const updatedFilter = addUpdateRestrictionPipeline(userID, filter);
		this.setQuery(updatedFilter);

		next();
	}
);

chapterSchema.pre('save', async function (next) {
	const userID = this.user as string;
	const storylineID = this.storyline as string;

	const { filter, options } = addCollaborationRestrictionOnSave(userID, storylineID);
	const storyline = await Storyline.aggregate(filter, options).cursor().next();

	if (storyline && !storyline.userPermissions?.collaborate) {
		throw new Error('You have no permission to collaborate on this storyline');
	}

	next();
});

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

export const Chapter = mongoose.models[label]
	? model<ChapterProperties>(label)
	: model<ChapterProperties>(label, chapterSchema);
