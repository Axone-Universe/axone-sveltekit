import { label, type CampaignProperties } from '$lib/properties/campaign';
import { label as BookLabel } from '$lib/properties/book';
import mongoose, { PipelineStage, Schema, model } from 'mongoose';
import {
	addArchivedRestrictionFilter,
	addOwnerUpdateRestrictionFilter,
	setUpdateDate
} from './permission';

export const campaignSchema = new Schema<CampaignProperties>({
	_id: { type: String, required: true },
	user: { type: String, required: true },
	startDate: Date,
	endDate: Date,
	criteria: [{ type: Object }],
	rewards: [{ type: Object }],
	resources: [{ type: Object }],
	book: { type: String, ref: BookLabel, required: true },
	createdAt: Date,
	updatedAt: Date
});

campaignSchema.pre('aggregate', function (next) {
	const pipeline = this.pipeline();
	// Used for pipelines that must be put after the default populate and permissions
	// The order is usually important e.g. limit pipeline should be at the end
	const postPipeline = this.options.postPipeline ?? [];

	populate(pipeline);

	for (const filter of postPipeline) {
		pipeline.push(filter);
	}

	next();
});

campaignSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addOwnerUpdateRestrictionFilter(userID, filter);
	this.setQuery(updatedFilter);

	next();
});

campaignSchema.pre(
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

campaignSchema.pre('save', function (next) {
	this.createdAt = this.updatedAt = new Date();
	next();
});

/**
 * Add fields you want to be populated by default here
 * @param query
 */
function populate(pipeline: PipelineStage[]) {
	pipeline.push(
		{
			$lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'book' }
		},
		{
			$unwind: {
				path: '$book',
				preserveNullAndEmptyArrays: true
			}
		}
	);
}
export const Campaign = mongoose.models[label]
	? model<CampaignProperties>(label)
	: model<CampaignProperties>(label, campaignSchema);
