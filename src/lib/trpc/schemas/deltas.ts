import { z } from 'zod';
import type { DeltaQuery } from '$lib/util/types';

export const update = z.object({
	id: z.string(),
	chapterID: z.string(),
	ops: z.string().optional()
}) satisfies z.ZodType<DeltaQuery>;

export const search = z.object({
	id: z.string()
});

export const create = z.object({
	chapterID: z.string()
});
