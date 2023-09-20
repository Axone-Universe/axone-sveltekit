import mongoose, { Schema, model } from 'mongoose';

import { label as UserLabel } from '$lib/properties/user';
import { label, type ReviewProperties, REVIEW_OF, RATING } from '$lib/properties/review';

const reviewSchema = new Schema<ReviewProperties>({
	_id: { type: String, required: true },
	item: { type: String, refPath: 'reviewOf', required: true },
	user: { type: String, ref: UserLabel, required: true },
	reviewOf: {
		type: String,
		enum: REVIEW_OF,
		required: true
	},
	rating: {
		type: Number,
		enum: RATING,
		required: true
	},
	title: String,
	text: String,
	// Super important note about dates and their modification:
	// https://mongoosejs.com/docs/schematypes.html#dates
	createDate: {
		type: Date,
		required: true
	}
});

reviewSchema.index({ item: 1, user: 1 }, { unique: true });

export const Review = mongoose.models[label]
	? model<ReviewProperties>(label)
	: model<ReviewProperties>(label, reviewSchema);
