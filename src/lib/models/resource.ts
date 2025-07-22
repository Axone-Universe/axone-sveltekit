import { label, type ResourceProperties } from '$lib/properties/resource';
import { label as ChapterLabel } from '$lib/properties/chapter';
import { label as UserLabel } from '$lib/properties/user';
import mongoose, { PipelineStage, Schema, model } from 'mongoose';

export const resourceSchema = new Schema<ResourceProperties>({
	_id: { type: String, required: true },
	user: { type: String, ref: UserLabel, required: true },
	chapter: { type: String, ref: ChapterLabel, required: false },
	src: String,
	alt: String,
	type: String,
	title: String,
	description: String,
	metadata: Object
});

resourceSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

resourceSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	populate(pipeline);

	// TODO: add permissions logic
	next();
});

resourceSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
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
}

export const Resource = mongoose.models[label] || model<ResourceProperties>(label, resourceSchema);
