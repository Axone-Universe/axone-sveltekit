import { label, type StorylineProperties } from '$lib/shared/storyline';
import mongoose, { Schema, model } from 'mongoose';
import { label as BookLabel } from '$lib/shared/book';
import { label as UserLabel } from '$lib/shared/user';
import { label as ChapterLabel } from '$lib/shared/chapter';

export const storylineSchema = new Schema<StorylineProperties>({
	_id: { type: String, required: true },
	main: { type: Boolean, required: true },
	book: { type: String, ref: BookLabel, required: true },
	user: { type: String, ref: UserLabel, required: true },
	chapters: [{ type: String, ref: ChapterLabel }],
	title: String,
	description: String,
	imageURL: String
});

storylineSchema.pre('find', function (next) {
	populate(this);
	next();
});

function populate(query: any) {
	query.populate('user').populate('chapters');
}

export const Storyline =
	mongoose.models[label] || model<StorylineProperties>(label, storylineSchema);
