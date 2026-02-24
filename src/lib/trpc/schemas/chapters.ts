import { z } from 'zod';
import { permissions } from './permissions';

export const create = z.object({
	title: z.string(),
	description: z.string(),
	bookID: z.string(),
	storylineID: z.string(),
	prevChapterID: z.string().optional(),
	permissions: z.record(z.string(), permissions).optional()
});

export const createComment = z.object({
	chapterId: z.string(),
	comment: z.string()
});

export const deleteComment = z.object({
	chapterId: z.string(),
	commentId: z.string()
});

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.number().optional(),
	skip: z.number().optional(),
	id: z.string().optional(),
	storylineChapterIDs: z.array(z.string()).optional(),
	searchTerm: z.string().optional(),
	toChapterID: z.string().optional(),
	storylineID: z.string().optional(),
	user: z.string().optional(),
	archived: z.boolean().optional()
});

export const getById = z.object({
	id: z.string(),
	limit: z.number().optional(),
	skip: z.number().optional()
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
	permissions: z.record(z.string(), permissions).optional()
});

export type ReadChapter = z.infer<typeof read>;

export type GetByIdSchema = z.infer<typeof getById>;
