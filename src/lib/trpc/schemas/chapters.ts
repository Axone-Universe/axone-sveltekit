import { z } from 'zod';
import { permissions } from './permissions';
import { userNotification } from './notifications';

export const create = z.object({
	title: z.string(),
	description: z.string(),
	bookID: z.string(),
	storylineID: z.string(),
	prevChapterID: z.string().optional(),
	permissions: z.record(z.string(), permissions).optional(),
	notifications: z.record(z.string(), userNotification).optional()
});

export const read = z.object({
	id: z.string().optional(),
	storylineChapterIDs: z.array(z.string()).optional(),
	searchTerm: z.string().optional(),
	toChapterID: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional(),
	storylineID: z.string().optional(),
	cursor: z.string().optional(),
	user: z.string().optional(),
	archived: z.boolean().optional()
});

export const readFromStoryline = z.object({
	storylineID: z.string(),
	storylineChapterIDs: z.array(z.string()),
	toChapterID: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});

export const update = z.object({
	id: z.string(),
	title: z.string().optional(),
	description: z.string().optional(),
	permissions: z.record(z.string(), permissions).optional(),
	notifications: z.record(z.string(), userNotification).optional()
});

export type ReadChapter = z.infer<typeof read>;
