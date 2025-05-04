import { z } from 'zod';

import { create as createBook, update as updateBook } from '$lib/trpc/schemas/books';
import { topicNotification, userNotification } from './notifications';

export const create = z.object({
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	resources: z
		.array(
			z.object({
				value: z.string(),
				link: z.string()
			})
		)
		.optional(),
	criteria: z
		.array(
			z.object({
				value: z.string(),
				link: z.string()
			})
		)
		.optional(),
	rewards: z
		.array(
			z.object({
				value: z.string(),
				link: z.string()
			})
		)
		.optional(),
	origin: z.string(),
	book: createBook,
	notifications: z.record(z.string(), userNotification.or(topicNotification)).optional()
});

export const update = z.object({
	id: z.string(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	resources: z
		.array(
			z.object({
				value: z.string(),
				link: z.string()
			})
		)
		.optional(),
	criteria: z
		.array(
			z.object({
				value: z.string(),
				link: z.string()
			})
		)
		.optional(),
	rewards: z
		.array(
			z.object({
				value: z.string(),
				link: z.string()
			})
		)
		.optional(),
	winners: z.array(z.string()).optional(),
	book: updateBook.optional(),
	notifications: z.record(z.string(), userNotification.or(topicNotification)).optional()
});

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.number().optional(),
	skip: z.number().optional(),
	id: z.string().optional(),
	open: z.boolean().optional()
});

export type CreateCampaign = z.infer<typeof create>;
export type ReadCampaign = z.infer<typeof read>;
