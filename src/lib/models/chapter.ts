import { label, type ChapterProperties } from '$lib/shared/chapter';
import mongoose, { Schema, model } from 'mongoose';
import { label as BookLabel } from '$lib/shared/book';
import { label as UserLabel } from '$lib/shared/user';
import { label as DeltaLabel } from '$lib/shared/delta';
import {
	addReadPermissionFilter,
	addDeletePermissionFilter,
	addUpdatePermissionFilter,
	permissionSchema
} from './permission';

export const chapterSchema = new Schema<ChapterProperties>({
	_id: { type: String, required: true },
	book: { type: String, ref: BookLabel, required: true },
	user: { type: String, ref: UserLabel, required: true },
	delta: { type: String, ref: DeltaLabel },
	children: [{ type: String, ref: label }],
	permissions: { type: Map, of: permissionSchema },
	title: String,
	description: String
});

chapterSchema.pre(['find', 'findOne'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addReadPermissionFilter(userID, filter);
	this.setQuery(updatedFilter);

	populate(this);
	next();
});

chapterSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addDeletePermissionFilter(userID, filter);
	this.setQuery(updatedFilter);

	next();
});

chapterSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		const updatedFilter = addUpdatePermissionFilter(userID, filter);
		this.setQuery(updatedFilter);

		next();
	}
);

function populate(query: any) {
	query.populate([{ path: 'user' }, { path: 'permissions.$*.user' }]);
}

export const Chapter = mongoose.models[label] || model<ChapterProperties>(label, chapterSchema);
