import { GENRES } from '$lib/shared/genre';
import { label, USER_LABELS, type UserProperties } from '$lib/shared/user';
import mongoose, { Schema, model } from 'mongoose';

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
	]
});

userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

export const User = mongoose.models[label]
	? model<UserProperties>(label)
	: model<UserProperties>(label, userSchema);
