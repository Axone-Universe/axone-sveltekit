import { label, type BookProperties } from '$lib/shared/book';
import mongoose, { Schema, model } from 'mongoose';
import { genresSchemaProperties } from './genres';
import { label as UserLabel } from '$lib/shared/user';
import { permissionSchema } from './permission';

export const bookSchema = new Schema<BookProperties>({
	_id: { type: String, required: true },
	user: { type: String, ref: UserLabel, required: true },
	title: String,
	description: String,
	imageURL: String,
	tags: String,
	permissions: [permissionSchema],
	genres: genresSchemaProperties
});

bookSchema.pre(['find', 'findOne'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	let permissionFilter = {};

	// We'll only get books with public permissions
	if (!userID) {
		permissionFilter = { permissions: { $elemMatch: { public: true } } };
	} else {
		permissionFilter = {
			$or: [
				{ user: userID },
				{ permissions: { $elemMatch: { $or: [{ public: true }, { user: userID }] } } }
			]
		};
	}

	const updatedFilter = { $and: [filter, permissionFilter] };
	this.setQuery(updatedFilter);

	populate(this);
	next();
});

bookSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	let permissionFilter = {};

	// We'll only get books with public permissions
	if (!userID) {
		throw new Error('Unknown user requesting delete');
	}

	permissionFilter = { user: userID };

	const updatedFilter = { $and: [filter, permissionFilter] };
	this.setQuery(updatedFilter);

	next();
});

bookSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		let permissionFilter = {};

		// We'll only get books with public permissions
		if (!userID) {
			permissionFilter = { permissions: { $elemMatch: { public: true, permission: 'edit' } } };
		} else {
			permissionFilter = {
				$or: [
					{ user: userID },
					{
						permissions: {
							$elemMatch: { $or: [{ public: true }, { user: userID, permission: 'edit' }] }
						}
					}
				]
			};
		}

		const updatedFilter = { $and: [filter, permissionFilter] };
		this.setQuery(updatedFilter);

		populate(this);
		next();
	}
);

/**
 * Add fields you want to be populated by default here
 * @param query
 */
function populate(query: any) {
	query.populate('user');
}

export const Book = mongoose.models[label] || model<BookProperties>(label, bookSchema);
