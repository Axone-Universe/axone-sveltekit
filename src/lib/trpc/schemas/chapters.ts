import { z } from 'zod';
import { genres } from './shared';

export const create = z.object({
	title: z.string(),
	description: z.string(),
	bookID: z.string(),
	storylineID: z.string(),
	prevChapterID: z.string().optional()
});

export const search = z.object({
	storylineID: z.string().optional(),
	searchTerm: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});