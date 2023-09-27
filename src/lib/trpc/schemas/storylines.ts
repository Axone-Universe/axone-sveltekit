import { z } from 'zod';
import { permissions } from './permissions';

export const storylineQuerySchema = z.object({
	bookID: z.string().optional(),
	title: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});
export const update = z.object({
	id: z.string(),
	title: z.string().optional(),
	description: z.string().optional(),
	book: z.unknown().optional(),
	imageURL: z.string().optional(),
	parent: z.string().optional(),
	parentChapter: z.string().optional(),
	published: z.boolean().optional(),
	permissions: z.record(z.string(), permissions).optional()
});
export const search = z.object({
	bookID: z.string().optional(),
	storylineID: z.string().optional(),
	main: z.boolean().optional(),
	searchTerm: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});

export const create = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	book: z.unknown().optional(),
	imageURL: z.string().optional(),
	parent: z.string().optional(),
	parentChapter: z.string().optional(),
	published: z.boolean().optional(),
	permissions: z.record(z.string(), permissions).optional()
});

export const read = z.object({
	bookID: z.string().optional(),
	storylineID: z.string().optional(),
	main: z.boolean().optional(),
	searchTerm: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});
