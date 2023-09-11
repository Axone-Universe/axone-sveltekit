import { label, type CampaignProperties } from '$lib/shared/campaign';
import mongoose, { Schema, model } from 'mongoose';

export const campaignSchema = new Schema<CampaignProperties>({
	_id: { type: String, required: true },
	title: String,
	organizer: String,
	dates: [String],
	previewText: String,
	tags: [String],
	bannerURL: String,
	submissionCriteria: String,
	rewards: String,
	about: String
});

export const Campaign = mongoose.models[label]
	? model<CampaignProperties>(label)
	: model<CampaignProperties>(label, campaignSchema);
