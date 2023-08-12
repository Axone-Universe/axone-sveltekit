import { label, type UserProperties } from '$lib/shared/user';
import mongoose, { Schema, model } from 'mongoose';
import { genresSchemaProperties } from './genres';

const usersSchemaProperties = {
	Writer: Boolean,
	Illustrator: Boolean,
	Editor: Boolean
};

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
	genres: genresSchemaProperties,
	labels: usersSchemaProperties
});

export const User = mongoose.models[label] || model<UserProperties>(label, userSchema);
