import { z } from 'zod';
import { permissions } from './permissions';

export const storylineQuerySchema = z.object({
	bookID: z.string().optional(),
	title: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});

export const search = z.object({
	bookID: z.string(),
	storylineID: z.string().optional(),
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
	permissions: z.array(permissions).optional()
});
