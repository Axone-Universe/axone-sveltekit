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

export const create = z.object({
	title: z.string(),
	description: z.string(),
	bookID: z.string(),
	imageURL: z.string().optional(),
	parentStorylineID: z.string().optional(),
	branchOffChapterID: z.string().optional()
});
