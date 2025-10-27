import { GENRES } from '$lib/properties/genre';
import { AXONE_ADMIN_EMAIL } from '$env/static/private';
import {
	DEFAULT_READING_LIST,
	label,
	USER_LABELS,
	type UserProperties
} from '$lib/properties/user';
import { label as StorylineLabel } from '$lib/properties/storyline';
import mongoose, { Schema, model } from 'mongoose';
import { addOwnerUpdateRestrictionFilter, setUpdateDate } from './permission';

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
	admin: Boolean,
	ambassador: Boolean,
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
	referralSource: String,
	referralAboutSource: String,
	referralSocialMediaSource: [String],
	referralUser: { type: String, ref: label },
	createdAt: Date,
	updatedAt: Date
});

userSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		const user = this.getOptions().user;
		const filter = this.getFilter();
		const update = this.getUpdate() as any;

		if (update?.$set?.admin !== undefined) {
			if (user.email !== AXONE_ADMIN_EMAIL) {
				// prevent unauthorized change
				delete update?.$set?.admin;
			}
		}
		setUpdateDate(update);

		const updatedFilter = addOwnerUpdateRestrictionFilter(user, filter);

		this.setQuery(updatedFilter);

		next();
	}
);

userSchema.pre('save', function (next) {
	this.createdAt = this.updatedAt = new Date();

	if (this.admin && this.email !== AXONE_ADMIN_EMAIL) {
		this.admin = false;
	}

	next();
});

userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

export const User = mongoose.models[label]
	? model<UserProperties>(label)
	: model<UserProperties>(label, userSchema);
