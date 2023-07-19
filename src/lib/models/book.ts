import { label, type BookProperties } from '$lib/shared/book';
import mongoose, { Schema, model } from 'mongoose';
import { genresSchemaProperties } from './genres';
import { label as UserLabel } from '$lib/shared/user';

export const bookSchema = new Schema<BookProperties>({
	_id: { type: String, required: true },
	user: { type: String, ref: UserLabel, required: true },
	title: String,
	description: String,
	imageURL: String,
	tags: String,
	genres: genresSchemaProperties
});

bookSchema.pre('find', function (next) {
	populate(this);
	next();
});

function populate(query: any) {
	query.populate('user');
}

export const Book = mongoose.models[label] || model<BookProperties>(label, bookSchema);
