import { label, type DeltaProperties, type VersionProperties } from '$lib/properties/delta';
import { label as ChapterLabel } from '$lib/properties/chapter';
import { label as UserLabel } from '$lib/properties/user';
import mongoose, { Schema, model } from 'mongoose';
import {
	addArchivedRestrictionFilter,
	addCollaboratorUpdateRestrictionFilter,
	addViewRestrictionPipeline,
	permissionSchema,
	setUpdateDate
} from './permission';
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
	user: { type: String, ref: UserLabel, required: true },
	chapter: { type: String, ref: ChapterLabel, required: true },
	permissions: { type: Map, of: permissionSchema },
	versions: [versionSchema],
	archived: { type: Boolean, default: false },
	updatedAt: Date
});

deltaSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

deltaSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	addViewRestrictionPipeline(userID, pipeline, 'chapters', 'chapter');
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

		setUpdateDate(this.getUpdate());

		let updatedFilter = addCollaboratorUpdateRestrictionFilter(userID, filter);
		updatedFilter = addArchivedRestrictionFilter(updatedFilter);

		this.setQuery(updatedFilter);

		next();
	}
);

export const Delta = mongoose.models[label]
	? model<DeltaProperties>(label)
	: model<DeltaProperties>(label, deltaSchema);
