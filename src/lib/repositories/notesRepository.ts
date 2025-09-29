import { Note } from '$lib/models/note';
import { Repository } from '$lib/repositories/repository';
import type { NoteProperties } from '$lib/properties/note';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';
import type { Context } from '$lib/trpc/context';

export class NotesRepository extends Repository {
	constructor() {
		super();
	}

	async getById(ctx: Context, id?: string): Promise<HydratedDocument<NoteProperties>> {
		const note = await Note.aggregate([{ $match: { _id: id } }], {
			user: ctx.user
		})
			.cursor()
			.next();

		return new Promise<HydratedDocument<NoteProperties>>((resolve) => {
			resolve(note);
		});
	}

	async getByChapterID(
		ctx: Context,
		chapterID?: string
	): Promise<HydratedDocument<NoteProperties>[]> {
		const notes = await Note.aggregate([{ $match: { chapter: chapterID } }], {
			user: ctx.user
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
