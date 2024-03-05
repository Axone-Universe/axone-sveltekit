import { label, type BookProperties } from '$lib/properties/book';
import mongoose, { Schema, model, type PipelineStage } from 'mongoose';
import { label as UserLabel } from '$lib/properties/user';
import { label as CampaignLabel } from '$lib/properties/campaign';
import {
	addUserPermissionPipeline,
	addOwnerUpdateRestrictionFilter,
	permissionSchema,
	addArchivedRestrictionFilter
} from './permission';
import { GENRES } from '$lib/properties/genre';

export const bookSchema = new Schema<BookProperties>({
	_id: { type: String, required: true },
	user: { type: String, ref: UserLabel, required: true },
	title: String,
	description: String,
	imageURL: String,
	tags: [{ type: String }],
	permissions: { type: Map, of: permissionSchema },
	genres: [
		{
			type: String,
			enum: GENRES
		}
	],
	rating: { type: Number, default: 0 },
	archived: { type: Boolean, default: false },
	campaign: { type: String, ref: CampaignLabel, required: false }
});

bookSchema.index({ title: 'text', tags: 'text' });

bookSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

bookSchema.pre('aggregate', function (next) {
	const userID = this.options.userID;
	const pipeline = this.pipeline();
	// Used for pipelines that must be put after the default populate and permissions
	// The order is usually important e.g. limit pipeline should be at the end
	const postPipeline = this.options.postPipeline ?? [];

	populate(pipeline);
	addUserPermissionPipeline(userID, pipeline);

	for (const filter of postPipeline) {
		pipeline.push(filter);
	}

	next();
});

bookSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const userID = this.getOptions().userID;
	const filter = this.getFilter();

	const updatedFilter = addOwnerUpdateRestrictionFilter(userID, filter);
	this.setQuery(updatedFilter);

	next();
});

bookSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		let updatedFilter = addOwnerUpdateRestrictionFilter(userID, filter);
		updatedFilter = addArchivedRestrictionFilter(updatedFilter);

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
		},
		{
			$lookup: { from: 'campaigns', localField: 'campaign', foreignField: '_id', as: 'campaign' }
		},
		{
			$unwind: {
				path: '$campaign',
				preserveNullAndEmptyArrays: true
			}
		}
	);
}

export const Book = mongoose.models[label]
	? model<BookProperties>(label)
	: model<BookProperties>(label, bookSchema);
