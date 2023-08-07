import { z } from 'zod';

export const update = z.object({
	id: z.string(),
	chapterID: z.string(),
	ops: z.string().optional()
});

export const search = z.object({
	id: z.string()
});

export const create = z.object({
	chapterID: z.string()
});
