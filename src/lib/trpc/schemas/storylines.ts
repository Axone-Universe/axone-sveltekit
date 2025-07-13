import { z } from 'zod';
import { permissions } from './permissions';
import { userNotification } from './notifications';
import { genreSchema } from './genres';
import { homeFilterTags } from '$lib/util/constants';

const TagsEnum = z.enum(homeFilterTags);
export const tagsSchema = z.array(TagsEnum);

export const storylineQuerySchema = z.object({
	bookID: z.string().optional(),
	title: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});
export const update = z.object({
	id: z.string(),
	title: z.string().optional(),
	main: z.boolean().optional(),
	description: z.string().optional(),
	book: z.unknown().optional(),
	imageURL: z.string().optional(),
	genres: genreSchema.optional(),
	tags: z.array(z.string()).optional(),
	parent: z.string().optional(),
	parentChapter: z.string().optional(),
	permissions: z.record(z.string(), permissions).optional(),
	notifications: z.record(z.string(), userNotification).optional()
});

export const create = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	book: z.unknown().optional(),
	imageURL: z.string().optional(),
	genres: genreSchema.optional(),
	tags: z.array(z.string()).optional(),
	parent: z.string().optional(),
	parentChapter: z.string().optional(),
	permissions: z.record(z.string(), permissions).optional(),
	notifications: z.record(z.string(), userNotification).optional()
});

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.number().optional(),
	skip: z.number().optional(),
	id: z.string().optional(),
	ids: z.array(z.string()).optional(),
	bookID: z.string().optional(),
	storylineID: z.string().optional(),
	main: z.boolean().optional(),
	searchTerm: z.string().optional(),
	genres: genreSchema.optional(),
	tags: tagsSchema.optional(),
	title: z.string().optional(),
	user: z.string().optional(),
	archived: z.boolean().optional()
});

export type ReadStoryline = z.infer<typeof read>;
