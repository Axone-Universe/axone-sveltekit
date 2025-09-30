import { label, TAGS, type NoteProperties } from '$lib/properties/note';
import { label as ChapterLabel } from '$lib/properties/chapter';
import mongoose, { Schema, model } from 'mongoose';
import { addViewRestrictionPipeline, permissionSchema } from './permission';

export const noteSchema = new Schema<NoteProperties>({
	_id: { type: String, required: true },
	title: { type: String, required: true },
	chapter: { type: String, ref: ChapterLabel, required: true },
	permissions: { type: Map, of: permissionSchema },
	tags: [
		{
			type: String,
			enum: TAGS
		}
	],
	note: String
});

noteSchema.pre(['find', 'findOne'], function () {
	throw new Error('Please use aggregate.');
});

noteSchema.pre('aggregate', function (next) {
	const user = this.options.user;
	const pipeline = this.pipeline();

	addViewRestrictionPipeline(user, pipeline, 'chapters', 'chapter');
	next();
});

noteSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		next();
	}
);

export const Note = mongoose.models[label] || model<NoteProperties>(label, noteSchema);
