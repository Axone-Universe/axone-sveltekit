import { label, type DeltaProperties, type VersionProperties } from '$lib/properties/delta';
import { label as ChapterLabel } from '$lib/properties/chapter';
import mongoose, { Schema, model } from 'mongoose';
import { addRestrictionsPipeline, addUpdatePermissionFilter, permissionSchema } from './permission';
import type Op from 'quill-delta/dist/Op';
import QuillDelta from 'quill-delta';

export const versionSchema = new Schema<VersionProperties>({
	_id: String,
	date: String,
	title: String,
	ops: Object
});

export const deltaSchema = new Schema<DeltaProperties>({
	_id: { type: String, required: true },
	chapter: { type: String, ref: ChapterLabel, required: true },
	permissions: { type: Map, of: permissionSchema },
	versions: [versionSchema]
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

deltaSchema.post('aggregate', function (docs) {
	for (const doc of docs) {
		doc.ops = createDeltaOps(doc.versions);
	}
});

function createDeltaOps(versions: VersionProperties[]) {
	let delta = new QuillDelta();
	for (const version of versions) {
		const revisionDelta = new QuillDelta(version.ops as Op[]);
		delta = delta.compose(revisionDelta);
	}
	return delta.ops;
}

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
