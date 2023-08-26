import { label, type BookProperties } from '$lib/shared/book';
import mongoose, { Schema, model, type PipelineStage } from 'mongoose';
import { genresSchemaProperties } from './genres';
import { label as UserLabel } from '$lib/shared/user';
import {
	addDeletePermissionFilter,
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
	published: Boolean,
	permissions: { type: Map, of: permissionSchema },
	genres: genresSchemaProperties
});

bookSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

bookSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	// add populate pipeline
	populate(pipeline);
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
function populate(pipeline: PipelineStage[]) {
	pipeline.push(
		{
			$lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' }
		},
		{
			$unwind: {
				path: '$user',
				preserveNullAndEmptyArrays: true
			}
		}
	);

	pipeline.push(
		{
			$addFields: {
				permissionsArray: { $objectToArray: '$permissions' }
			}
		},
		{
			$lookup: {
				from: 'users',
				localField: 'permissionsArray.v.user',
				foreignField: '_id',
				as: 'permissionsUsers'
			}
		},
		{
			$unset: ['permissionsArray']
		}
	);
}

function permissions(userID: string, pipeline: PipelineStage[]) {
	pipeline.push({
		$addFields: {
			permissioned: {
				$cond: [
					{
						$or: [{ published: true }, { ['permissions.' + userID]: { $exists: true } }]
					},
					true,
					false
				]
			}
		}
	});
}

export const Book = mongoose.models[label] || model<BookProperties>(label, bookSchema);
