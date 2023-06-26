import { z } from 'zod';

import { auth } from '$lib/trpc/middleware/auth';
import { DeltasRepository } from '$lib/repositories/deltasRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { update, search, create } from '$lib/trpc/schemas/deltas';
import { DeltaBuilder, type DeltaResponse } from '$lib/nodes/digital-assets/delta';

const deltasRepo = new DeltasRepository();

export const deltas = t.router({
	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			let deltaBuilder = new DeltaBuilder().chapterID(input.chapterID);

			const deltaNodeResponse = await deltaBuilder.build();

			return deltaNodeResponse;
		}),
	getById: t.procedure
		.use(logger)
		.input(search)
		.query(async ({ input }) => {
			const result = await deltasRepo.getById(input.id);

			return result;
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			let deltaBuilder = new DeltaBuilder().id(input.id).chapterID(input.chapterID);

			if (input.ops) {
				await deltaBuilder.delta(input.id, input.ops);
			}

			let deltaResponse: DeltaResponse;

			deltaResponse = await deltaBuilder.update();

			return deltaResponse;
		})
});
