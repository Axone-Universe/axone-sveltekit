import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import type { NoteProperties, Tag } from '$lib/properties/note';
import { Note } from '$lib/models/note';
import type mongoose from 'mongoose';

export class NoteBuilder extends DocumentBuilder<HydratedDocument<NoteProperties>> {
	private _chapterID?: string;
	private _sessionUserID?: string;
	private readonly _noteProperties: NoteProperties;

	constructor(id?: string) {
		super();
		this._noteProperties = {
			title: '',
			_id: id ? id : ulid()
		};
	}

	chapterID(chapterID: string): NoteBuilder {
		this._chapterID = chapterID;
		this._noteProperties.chapter = chapterID;
		return this;
	}

	title(title: string): NoteBuilder {
		this._noteProperties.title = title;
		return this;
	}

	note(note: string): NoteBuilder {
		this._noteProperties.note = note;
		return this;
	}

	tags(tags: Tag[]) {
		this._noteProperties.tags = tags;
		return this;
	}

	sessionUserID(sessionUserID: string): NoteBuilder {
		this._sessionUserID = sessionUserID;
		return this;
	}

	async update(): Promise<HydratedDocument<NoteProperties>> {
		if (!this._noteProperties._id) throw new Error('Must provide a noteID to update the note.');

		const note = await Note.findOneAndUpdate(
			{ _id: this._noteProperties._id },
			this._noteProperties,
			{ new: true }
		);

		return note;
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		if (!this._noteProperties._id) throw new Error('Must provide a note ID to delete the note.');

		let result = {};

		result = await Note.deleteOne(
			{ _id: this._noteProperties._id },
			{ userID: this._sessionUserID }
		);

		return result as mongoose.mongo.DeleteResult;
	}

	async build(): Promise<HydratedDocument<NoteProperties>> {
		if (!this._chapterID) throw new Error('Must provide a chapterID to build the note.');

		const note = new Note(this._noteProperties);
		await note.save();

		const newNote = await Note.aggregate(
			[
				{
					$match: {
						_id: this._noteProperties._id
					}
				}
			],
			{
				userID: this._sessionUserID
			}
		)
			.cursor()
			.next();

		return newNote;
	}
}
