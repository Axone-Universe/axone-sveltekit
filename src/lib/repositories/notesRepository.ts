import { Note } from '$lib/models/note';
import { Repository } from '$lib/repositories/repository';
import type { NoteProperties } from '$lib/properties/note';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';

export class NotesRepository extends Repository {
	constructor() {
		super();
	}

	async getById(session: Session | null, id?: string): Promise<HydratedDocument<NoteProperties>> {
		const note = await Note.aggregate([{ $match: { _id: id } }], {
			userID: session?.user.id
		})
			.cursor()
			.next();

		return new Promise<HydratedDocument<NoteProperties>>((resolve) => {
			resolve(note);
		});
	}

	async getByChapterID(
		session: Session | null,
		chapterID?: string
	): Promise<HydratedDocument<NoteProperties>[]> {
		const notes = await Note.aggregate([{ $match: { chapter: chapterID } }], {
			userID: session?.user.id
		});

		return new Promise<HydratedDocument<NoteProperties>[]>((resolve) => {
			resolve(notes);
		});
	}

	async getAll(limit?: number, skip?: number): Promise<HydratedDocument<NoteProperties>[]> {
		throw new Error('not Implemented');
	}

	async getByTitle(
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<NoteProperties>[]> {
		throw new Error('not Implemented');
	}

	async count(): Promise<number> {
		const count = await Note.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
