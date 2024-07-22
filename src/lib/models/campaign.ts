import { label, type CampaignProperties } from '$lib/properties/campaign';
import { label as BookLabel } from '$lib/properties/book';
import mongoose, { Schema, model } from 'mongoose';
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
	submissionCriteria: String,
	rewards: String,
	book: { type: String, ref: BookLabel, required: true },
	createdAt: Date,
	updatedAt: Date
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

export const Campaign = mongoose.models[label]
	? model<CampaignProperties>(label)
	: model<CampaignProperties>(label, campaignSchema);
