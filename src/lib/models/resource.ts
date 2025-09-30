import { label, type ResourceProperties } from '$lib/properties/resource';
import { label as ChapterLabel } from '$lib/properties/chapter';
import { label as UserLabel } from '$lib/properties/user';
import mongoose, { type PipelineStage, Schema, model } from 'mongoose';

export const resourceSchema = new Schema<ResourceProperties>({
	_id: { type: String, required: true },
	user: { type: String, ref: UserLabel, required: true },
	chapter: { type: String, ref: ChapterLabel, required: false },
	externalId: String,
	price: Number,
	src: String,
	alt: String,
	type: String,
	nftId: String,
	nftWalletAddress: String,
	nftCollection: String,
	royalties: Number,
	title: String,
	isListed: Boolean,
	isTokenized: Boolean,
	description: String,
	license: String,
	properties: [{ type: Object }]
});

resourceSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

resourceSchema.pre('aggregate', function (next) {
	const user = this.options.user;
	const pipeline = this.pipeline();
	const postPipeline = this.options.postPipeline ?? [];

	populate(pipeline);
	// TODO: add permissions logic

	for (const filter of postPipeline) {
		pipeline.push(filter);
	}
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
		},
		{
			$lookup: { from: 'chapters', localField: 'chapter', foreignField: '_id', as: 'chapter' }
		},
		{
			$unwind: {
				path: '$chapter',
				preserveNullAndEmptyArrays: true
			}
		}
	);
}

export const Resource = mongoose.models[label] || model<ResourceProperties>(label, resourceSchema);
