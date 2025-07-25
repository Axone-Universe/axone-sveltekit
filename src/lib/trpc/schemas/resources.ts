import { z } from 'zod';
import { TAGS } from '$lib/properties/note';
import { resourceCollections, resourceTypes } from '$lib/properties/resource';

export const create = z.object({
	type: z.enum(resourceTypes),
	chapterID: z.string().optional()
});

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.number().optional(),
	skip: z.number().optional(),
	id: z.string().optional(),
	title: z.string().optional(),
	ids: z.array(z.string()).optional(),
	chapterID: z.string().optional(),
	userID: z.string().optional()
});

export const update = z.object({
	id: z.string(),
	userID: z.string().optional(),
	chapterID: z.string().optional(),
	title: z.string().optional(),
	description: z.string().optional(),
	type: z.enum(resourceTypes).optional(),
	collection: z.enum(resourceCollections).optional(),
	price: z.number().optional(),
	royalties: z.number().optional(),
	src: z.string().optional(),
	alt: z.string().optional(),
	properties: z.array(z.object({ name: z.string(), value: z.string() })).optional()
});

export type ReadResource = z.infer<typeof read>;
