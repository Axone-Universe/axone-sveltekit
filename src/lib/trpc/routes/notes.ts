import { auth } from '$lib/trpc/middleware/auth';
import { NotesRepository } from '$lib/repositories/notesRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { update, read, create } from '$lib/trpc/schemas/notes';
import { NoteBuilder } from '$lib/documents/digital-assets/note';

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

			const noteNodeResponse = await noteBuilder.build();

			return noteNodeResponse;
		}),
		
	getByChapterID: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const notesRepo = new NotesRepository();
			const result = await notesRepo.getByChapterID(ctx.session, input.chapterID);

			return result;
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

			const noteResponse = await noteBuilder.update();

			return noteResponse;
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const noteBuilder = new NoteBuilder(input.id).sessionUserID(ctx.session!.user.id);
			const response = await noteBuilder.delete();
			return response;
		})
});
