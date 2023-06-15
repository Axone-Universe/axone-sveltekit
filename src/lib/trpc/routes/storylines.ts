import { z } from 'zod';

import {
	BookBuilder,
	type BookSubmittedToCampaignResponse
} from '$lib/nodes/digital-products/book';
import { StorylineBuilder } from '$lib/nodes/digital-products/storyline';
import { StorylinesRepository } from '$lib/repositories/storyLinesRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, submitToCampaign } from '$lib/trpc/schemas/books';
import { search } from '$lib/trpc/schemas/storylines';
import { DBSession } from '$lib/db/session';
import type { Genres } from '$lib/util/types';

const storyLinesRepo = new StorylinesRepository();

export const storylines = t.router({
	getAll: t.procedure
		.use(logger)
		.input(search.optional())
		.query(async ({ input }) => {
			if (input?.bookID) {
				storyLinesRepo.bookId(input.bookID);
			}
			const result = await storyLinesRepo.getAll(input?.limit, input?.skip);

			return result;
		})
});
