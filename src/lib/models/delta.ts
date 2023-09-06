import { label, type DeltaProperties } from '$lib/shared/delta';
import { label as ChapterLabel } from '$lib/shared/chapter';
import mongoose, { Schema, model } from 'mongoose';
import { addRestrictionsPipeline, addUpdatePermissionFilter, permissionSchema } from './permission';

export const deltaSchema = new Schema<DeltaProperties>({
	_id: { type: String, required: true },
	chapter: { type: String, ref: ChapterLabel, required: true },
	permissions: { type: Map, of: permissionSchema },
	ops: Object
});

deltaSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

deltaSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	addRestrictionsPipeline(userID, pipeline, 'chapters', 'chapter');
	next();
});

deltaSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		const updatedFilter = addUpdatePermissionFilter(userID, filter);
		this.setQuery(updatedFilter);

		next();
	}
);

export const Delta = mongoose.models[label]
	? model<DeltaProperties>(label)
	: model<DeltaProperties>(label, deltaSchema);
