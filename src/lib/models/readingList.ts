import { label, type ReadingListProperties } from '$lib/properties/readingList';
import mongoose, { Schema, model } from 'mongoose';
import { addRestrictionsPipeline } from './permission';

export const readingListSchema = new Schema<ReadingListProperties>({
	title: { type: String, required: true },
	books: { type: Map, of: String }
});

readingListSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

readingListSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	addRestrictionsPipeline(userID, pipeline, 'chapters', 'chapter');
	next();
});

readingListSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		next();
	}
);

export const ReadingList =
	mongoose.models[label] || model<ReadingListProperties>(label, readingListSchema);
