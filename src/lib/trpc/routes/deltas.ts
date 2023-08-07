import { auth } from '$lib/trpc/middleware/auth';
import { DeltasRepository } from '$lib/repositories/deltasRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { update, search, create } from '$lib/trpc/schemas/deltas';
import { DeltaBuilder } from '$lib/documents/digital-assets/delta';

export const deltas = t.router({
	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input }) => {
			const deltaBuilder = new DeltaBuilder().chapterID(input.chapterID);

			const deltaNodeResponse = await deltaBuilder.build();

			return deltaNodeResponse;
		}),
	getById: t.procedure
		.use(logger)
		.input(search)
		.query(async ({ input }) => {
			const deltasRepo = new DeltasRepository();
			const result = await deltasRepo.getById(input.id);

			console.log('** 1 serv setting edtior ');

			return result;
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input }) => {
			const deltaBuilder = new DeltaBuilder(input.id).chapterID(input.chapterID);

			if (input.ops) {
				await deltaBuilder.delta(input.id, input.ops);
			}

			const deltaResponse = await deltaBuilder.update();

			return deltaResponse;
		})
});
