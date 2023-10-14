import { auth } from '$lib/trpc/middleware/auth';
import { DeltasRepository } from '$lib/repositories/deltasRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { update, read, create, history } from '$lib/trpc/schemas/deltas';
import { DeltaBuilder } from '$lib/documents/digital-assets/delta';

export const deltas = t.router({
	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const deltaBuilder = new DeltaBuilder()
				.sessionUserID(ctx.session!.user.id)
				.chapterID(input.chapterID);

			const deltaNodeResponse = await deltaBuilder.build();

			return deltaNodeResponse;
		}),

	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const deltasRepo = new DeltasRepository();
			const result = await deltasRepo.getById(ctx.session, input.id);

			return result;
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const deltaBuilder = new DeltaBuilder(input.id)
				.sessionUserID(ctx.session!.user.id)
				.chapterID(input.chapterID);

			if (input.ops) {
				await deltaBuilder.delta(input.ops);
			}

			const deltaResponse = await deltaBuilder.update();

			return deltaResponse;
		}),

	createVersion: t.procedure
		.use(logger)
		.use(auth)
		.input(history)
		.mutation(async ({ input, ctx }) => {
			const deltaBuilder = new DeltaBuilder(input.id)
				.sessionUserID(ctx.session!.user.id)
				.chapterID(input.chapterID);

			console.log('** delta trpc');
			await deltaBuilder.createVersion(input.title);
			const deltaResponse = await deltaBuilder.update();

			return deltaResponse;
		})
});
