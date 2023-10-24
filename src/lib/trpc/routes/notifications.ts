import { auth } from '$lib/trpc/middleware/auth';
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
		})
});
