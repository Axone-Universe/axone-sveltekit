import { z } from 'zod';

export const create = z.object({
	chapterID: z.string()
});

export const read = z.object({
	id: z.string()
});

export const update = z.object({
	id: z.string(),
	chapterID: z.string(),
	ops: z.string().optional()
});

export const history = z.object({
	id: z.string(),
	chapterID: z.string(),
	title: z.string().optional()
});
