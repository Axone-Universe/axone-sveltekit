import { label, type BookProperties } from '$lib/shared/book';
import mongoose, { Schema, model } from 'mongoose';
import { genresSchemaProperties } from './genres';
import { label as UserLabel } from '$lib/shared/user';
import {
	addDeletePermissionFilter,
	addReadPermissionFilter,
	addUpdatePermissionFilter,
	permissionSchema
} from './permission';

export const bookSchema = new Schema<BookProperties>({
	_id: { type: String, required: true },
	user: { type: String, ref: UserLabel, required: true },
	title: String,
	description: String,
	imageURL: String,
	tags: String,
	permissions: { type: Map, of: permissionSchema },
	genres: genresSchemaProperties
});



bookSchema.pre(['find', 'findOne'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addReadPermissionFilter(userID, filter);
	this.setQuery(updatedFilter);

	populate(this);
	next();
});

bookSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addDeletePermissionFilter(userID, filter);
	this.setQuery(updatedFilter);

	next();
});

bookSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		const updatedFilter = addUpdatePermissionFilter(userID, filter);
		this.setQuery(updatedFilter);

		next();
	}
);

/**
 * Add fields you want to be populated by default here
 * @param query
 */
function populate(query: any) {
	query.populate([{ path: 'user' }, { path: 'permissions.$*.user' }]);
}

export const Book = mongoose.models[label] || model<BookProperties>(label, bookSchema);
