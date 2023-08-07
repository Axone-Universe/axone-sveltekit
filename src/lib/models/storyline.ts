import { label, type StorylineProperties } from '$lib/shared/storyline';
import mongoose, { Schema, model } from 'mongoose';
import { label as BookLabel } from '$lib/shared/book';
import { label as UserLabel } from '$lib/shared/user';
import { label as ChapterLabel } from '$lib/shared/chapter';
import {
	addReadPermissionFilter,
	addDeletePermissionFilter,
	addUpdatePermissionFilter,
	permissionSchema
} from './permission';

export const storylineSchema = new Schema<StorylineProperties>({
	_id: { type: String, required: true },
	main: { type: Boolean, required: true },
	book: { type: String, ref: BookLabel, required: true },
	user: { type: String, ref: UserLabel, required: true },
	chapters: [{ type: String, ref: ChapterLabel }],
	permissions: [permissionSchema],
	title: String,
	description: String,
	imageURL: String
});

storylineSchema.pre(['find', 'findOne'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addReadPermissionFilter(userID, filter);
	this.setQuery(updatedFilter);

	this.populate({ path: 'user chapters', options: { userID: userID } });
	next();
});

storylineSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addDeletePermissionFilter(userID, filter);
	this.setQuery(updatedFilter);

	next();
});

storylineSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		const updatedFilter = addUpdatePermissionFilter(userID, filter);
		this.setQuery(updatedFilter);

		next();
	}
);

export const Storyline =
	mongoose.models[label] || model<StorylineProperties>(label, storylineSchema);
