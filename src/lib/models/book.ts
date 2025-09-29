import { label, type BookProperties } from '$lib/properties/book';
import mongoose, { type ClientSession, Schema, model, type PipelineStage } from 'mongoose';
import { label as UserLabel } from '$lib/properties/user';
import { label as CampaignLabel } from '$lib/properties/campaign';
import { label as StorylineLabel } from '$lib/properties/storyline';
import {
	addUserPermissionPipeline,
	addOwnerUpdateRestrictionFilter,
	permissionSchema,
	addArchivedRestrictionFilter,
	setUpdateDate
} from './permission';
import { GENRES } from '$lib/properties/genre';

interface ExtendedBookProperties extends BookProperties {
	addStoryline: (storylineID: string, session?: ClientSession) => Promise<BookProperties>;
	removeStoryline: (storylineID: string, session?: ClientSession) => Promise<BookProperties>;
}

export const bookSchema = new Schema<ExtendedBookProperties>({
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
	storylines: [{ type: String, ref: StorylineLabel }],
	rating: { type: Number, default: 0 },
	archived: { type: Boolean, default: false },
	campaign: { type: String, ref: CampaignLabel, required: false },
	createdAt: Date,
	updatedAt: Date
});

bookSchema.index({ title: 'text', tags: 'text' });

bookSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

bookSchema.pre('aggregate', function (next) {
	const user = this.options.user;
	const pipeline = this.pipeline();
	// Used for pipelines that must be put after the default populate and permissions
	// The order is usually important e.g. limit pipeline should be at the end
	const postPipeline = this.options.postPipeline ?? [];

	populate(pipeline);
	addUserPermissionPipeline(user, pipeline);

	for (const filter of postPipeline) {
		pipeline.push(filter);
	}

	next();
});

bookSchema.pre(['deleteOne', 'findOneAndDelete', 'findOneAndRemove'], function (next) {
	const user = this.getOptions().user;
	const filter = this.getFilter();

	const updatedFilter = addOwnerUpdateRestrictionFilter(user, filter);
	this.setQuery(updatedFilter);

	next();
});

bookSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const user = this.getOptions().user;
		const filter = this.getFilter();

		setUpdateDate(this.getUpdate());

		let updatedFilter = addOwnerUpdateRestrictionFilter(user, filter);
		updatedFilter = addArchivedRestrictionFilter(updatedFilter);

		this.setQuery(updatedFilter);

		next();
	}
);

bookSchema.pre('save', function (next) {
	this.createdAt = this.updatedAt = new Date();
	next();
});

// Methods
bookSchema.methods.addStoryline = async function (storylineID: string, session?: ClientSession) {
	if (this.storylines.includes(storylineID)) {
		throw new Error('This book already has this storyline');
	}

	this.storylines.push(storylineID);
	return await this.save({ session });
};

bookSchema.methods.removeStoryline = async function (
	deleteStorylineID: string,
	session?: ClientSession
) {
	this.storylines = this.storylines.filter(
		(storylineID: string) => storylineID !== deleteStorylineID
	);
	return await this.save({ session });
};

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
	? model<ExtendedBookProperties>(label)
	: model<ExtendedBookProperties>(label, bookSchema);
