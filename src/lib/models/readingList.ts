import { label, TAGS, type ReadingListProperties } from '$lib/properties/readingList';
import { label as UserLabel } from '$lib/properties/user';
import { label as BookLabel } from '$lib/properties/book';
import mongoose, { Schema, model } from 'mongoose';
import { addRestrictionsPipeline, addUpdatePermissionFilter, permissionSchema } from './permission';

export const readingListSchema = new Schema<ReadingListProperties>({
	_id: { type: String, required: true },
	title: { type: String, required: true },
	user: { type: String, ref: UserLabel, required: true },
	books: [{ type: String, ref: BookLabel }]
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
