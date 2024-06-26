import { GENRES } from '$lib/properties/genre';
import {
	DEFAULT_READING_LIST,
	label,
	USER_LABELS,
	type UserProperties
} from '$lib/properties/user';
import { label as StorylineLabel } from '$lib/properties/storyline';
import mongoose, { Schema, model } from 'mongoose';
import { setUpdateDate } from './permission';

export const userSchema = new Schema<UserProperties>({
	_id: { type: String, required: true },
	firstName: String,
	lastName: String,
	about: String,
	imageURL: String,
	email: String,
	facebook: String,
	instagram: String,
	twitter: String,
	genres: [
		{
			type: String,
			enum: GENRES
		}
	],
	labels: [
		{
			type: String,
			enum: USER_LABELS
		}
	],
	readingLists: {
		type: Map,
		of: [
			{
				type: String,
				ref: StorylineLabel
			}
		],
		default: new Map([[DEFAULT_READING_LIST, []]])
	},
	createdAt: Date,
	updatedAt: Date
});

userSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const userID = this.getOptions().userID;
		const filter = this.getFilter();

		setUpdateDate(this.getUpdate());

		const updatedFilter = { $and: [filter, { _id: userID }] };

		this.setQuery(updatedFilter);

		next();
	}
);

userSchema.pre('save', function (next) {
	this.createdAt = this.updatedAt = new Date();
	next();
});

userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

export const User = mongoose.models[label]
	? model<UserProperties>(label)
	: model<UserProperties>(label, userSchema);
