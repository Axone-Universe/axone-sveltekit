import { z } from 'zod';
import { TAGS } from '$lib/properties/note';
import { resourceTypes } from '$lib/util/constants';

export const create = z.object({
	type: z.enum(resourceTypes),
	chapterID: z.string().optional()
});

export const read = z.object({
	id: z.string().optional(),
	ids: z.array(z.string()).optional(),
	chapterID: z.string().optional()
});

export const update = z.object({
	id: z.string(),
	userID: z.string().optional(),
	chapterID: z.string().optional(),
	title: z.string().optional(),
	description: z.string().optional(),
	type: z.enum(resourceTypes).optional(),
	src: z.string().optional(),
	alt: z.string().optional(),
	metadata: z.any().optional()
});
