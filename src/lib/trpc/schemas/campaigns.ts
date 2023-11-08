import { z } from 'zod';

import { create as createBook, update as updateBook } from '$lib/trpc/schemas/books';

export const create = z.object({
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	submissionCriteria: z.string(),
	rewards: z.string(),
	book: createBook
});

export const update = z.object({
	id: z.string(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	submissionCriteria: z.string().optional(),
	rewards: z.string().optional(),
	book: updateBook
});

export const read = z.object({
	id: z.string().optional(),
	limit: z.number().optional(),
	cursor: z.string().optional()
});

export type CreateCampaign = z.infer<typeof create>;
export type ReadCampaign = z.infer<typeof read>;
