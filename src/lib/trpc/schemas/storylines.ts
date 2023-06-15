import { z } from 'zod';

export const storylineQuerySchema = z.object({
	bookID: z.string().optional(),
	title: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});

export const search = z.object({
	bookID: z.string().optional(),
	searchTerm: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});
