import { z } from 'zod';
import { genreSchema } from './genres';
import { permissions } from './permissions';
import { userNotification } from './notifications';

import { homeFilterTags } from '$lib/util/constants';

const TagsEnum = z.enum(homeFilterTags);
export const tagsSchema = z.array(TagsEnum);

export const create = z.object({
	title: z.string(),
	description: z.string(),
	imageURL: z.string().optional(),
	genres: genreSchema.optional(),
	tags: z.array(z.string()).optional(),
	permissions: z.record(z.string(), permissions).optional(),
	notifications: z.record(z.string(), userNotification).optional()
});

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.number().optional(),
	skip: z.number().optional(),
	genres: genreSchema.optional(),
	tags: tagsSchema.optional(),
	title: z.string().optional(),
	id: z.string().optional(),
	user: z.string().optional(),
	archived: z.boolean().optional()
});

export const update = z.object({
	id: z.string(),
	title: z.string().optional(),
	description: z.string().optional(),
	imageURL: z.string().optional(),
	genres: genreSchema.optional(),
	tags: z.array(z.string()).optional(),
	permissions: z.record(z.string(), permissions).optional(),
	notifications: z.record(z.string(), userNotification).optional()
});

export const addStoryline = z.object({
	storylineID: z.string(),
	bookID: z.string()
});

export const search = z.object({
	limit: z.number().optional(),
	skip: z.number().optional(),
	genres: genreSchema.optional(),
	title: z.string().optional(),
	id: z.string().optional()
});

export type CreateBook = z.infer<typeof create>;
export type ReadBook = z.infer<typeof read>;
