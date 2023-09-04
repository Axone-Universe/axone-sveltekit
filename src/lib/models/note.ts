import { label, TAGS, type NoteProperties } from '$lib/shared/note';
import { label as ChapterLabel } from '$lib/shared/chapter';
import mongoose, { Schema, model } from 'mongoose';
import { addRestrictionsPipeline, addUpdatePermissionFilter, permissionSchema } from './permission';

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
	const userID = this.options.userID;
	const pipeline = this.pipeline();

	addRestrictionsPipeline(userID, pipeline, 'chapters', 'chapter');
	next();
});

noteSchema.pre(
	['updateOne', 'replaceOne', 'findOneAndReplace', 'findOneAndUpdate'],
	function (next) {
		next();
	}
);

export const Note = mongoose.models[label] || model<NoteProperties>(label, noteSchema);
