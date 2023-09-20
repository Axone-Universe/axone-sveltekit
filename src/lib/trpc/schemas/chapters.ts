import { z } from 'zod';
import { permissions } from './permissions';

export const create = z.object({
	title: z.string(),
	description: z.string(),
	bookID: z.string(),
	storylineID: z.string(),
	prevChapterID: z.string().optional(),
	published: z.boolean().optional(),
	permissions: z.record(z.string(), permissions).optional()
});

export const read = z.object({
	storylineChapterIDs: z.array(z.string()).optional(),
	searchTerm: z.string().optional(),
	toChapterID: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});

export const update = z.object({
	id: z.string(),
	title: z.string().optional(),
	description: z.string().optional(),
	published: z.boolean().optional(),
	permissions: z.record(z.string(), permissions).optional()
});
