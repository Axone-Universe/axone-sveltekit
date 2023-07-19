import { label, type ChapterProperties } from '$lib/shared/chapter';
import mongoose, { Schema, model } from 'mongoose';
import { label as BookLabel } from '$lib/shared/book';
import { label as UserLabel } from '$lib/shared/user';
import { label as DeltaLabel } from '$lib/shared/delta';

export const chapterSchema = new Schema<ChapterProperties>({
	_id: { type: String, required: true },
	book: { type: String, ref: BookLabel, required: true },
	user: { type: String, ref: UserLabel, required: true },
	delta: { type: String, ref: DeltaLabel },
	children: [{ type: String, ref: label }],
	title: String,
	description: String
});

chapterSchema.pre('find', function (next) {
	populate(this);
	next();
});

function populate(query: any) {
	query.populate('user');
}

export const Chapter = mongoose.models[label] || model<ChapterProperties>(label, chapterSchema);
