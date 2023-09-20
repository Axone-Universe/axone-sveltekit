import { z } from 'zod';
import { TAGS } from '$lib/properties/note';

const TagsEnum = z.enum(TAGS);

export const create = z.object({
	chapterID: z.string(),
	title: z.string(),
	note: z.string(),
	tags: z.array(TagsEnum).optional()
});

export const read = z.object({
	id: z.string().optional(),
	chapterID: z.string().optional()
});

export const update = z.object({
	id: z.string(),
	title: z.string().optional(),
	note: z.string().optional(),
	tags: z.array(TagsEnum).optional()
});
