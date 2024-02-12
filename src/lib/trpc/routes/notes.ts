import { auth } from '$lib/trpc/middleware/auth';
import { NotesRepository } from '$lib/repositories/notesRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { update, read, create } from '$lib/trpc/schemas/notes';
import { NoteBuilder } from '$lib/documents/digital-assets/note';
import type { Response } from '$lib/util/types';
import type { HydratedDocument } from 'mongoose';
import type { NoteProperties } from '$lib/properties/note';
import type mongoose from 'mongoose';

export const notes = t.router({
	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const noteBuilder = new NoteBuilder()
				.sessionUserID(ctx.session!.user.id)
				.title(input.title)
				.note(input.note)
				.chapterID(input.chapterID);

			if (input.tags) noteBuilder.tags(input.tags);

			const response: Response = {
				success: true,
				message: 'note successfully created',
				data: {}
			};
			try {
				const result = await noteBuilder.build();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<NoteProperties> } };
		}),

	getByChapterID: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const notesRepo = new NotesRepository();

			const response: Response = {
				success: true,
				message: 'notes successfully retrieved',
				data: {}
			};
			try {
				const result = await notesRepo.getByChapterID(ctx.session, input.chapterID);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<NoteProperties>[] } };
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const noteBuilder = new NoteBuilder(input.id).sessionUserID(ctx.session!.user.id);

			if (input.title) noteBuilder.title(input.title);
			if (input.note) noteBuilder.note(input.note);
			if (input.tags) noteBuilder.tags(input.tags);

			const response: Response = {
				success: true,
				message: 'note successfully updated',
				data: {}
			};
			try {
				const result = await noteBuilder.update();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<NoteProperties> } };
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const noteBuilder = new NoteBuilder(input.id).sessionUserID(ctx.session!.user.id);

			const response: Response = {
				success: true,
				message: 'note successfully deleted',
				data: {}
			};
			try {
				const result = await noteBuilder.delete();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as mongoose.mongo.DeleteResult } };
		})
});
