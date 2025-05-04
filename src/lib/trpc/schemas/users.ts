import { z } from 'zod';
import { genreSchema } from './genres';
import { USER_LABELS } from '$lib/properties/user';

const UserSchema = z.enum(USER_LABELS);

export const userSchema = z.array(UserSchema);

export const create = z.object({
	firstName: z.string().min(1).optional(),
	lastName: z.string().min(1).optional(),
	imageURL: z.string().optional(),
	about: z.string().optional(),
	email: z.string().optional(),
	facebook: z.string().optional(),
	instagram: z.string().optional(),
	twitter: z.string().optional(),
	genres: genreSchema.optional(),
	labels: userSchema.optional()
});

export const update = z.object({
	firstName: z.string().min(1).optional(),
	lastName: z.string().min(1).optional(),
	imageURL: z.string().optional(),
	about: z.string().optional(),
	email: z.string().optional(),
	facebook: z.string().optional(),
	instagram: z.string().optional(),
	twitter: z.string().optional(),
	genres: genreSchema.optional(),
	labels: userSchema.optional(),
	readingLists: z.map(z.string(), z.array(z.string())).optional()
});

export const getReadingList = z.object({
	name: z.string().optional()
});

export const createDeleteReadingList = z.object({
	name: z.string()
});

export const renameReadingList = z.object({
	oldName: z.string(),
	newName: z.string()
});

export const updateReadingLists = z.object({
	names: z.array(z.string()),
	storylineID: z.string()
});

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.number().optional(),
	skip: z.number().optional(),
	id: z.string().optional(),
	ids: z.array(z.string()).optional(),
	detail: z.string().optional(),
	genres: genreSchema.optional(),
	labels: userSchema.optional()
});

export type CreateDeleteReadingList = z.infer<typeof createDeleteReadingList>;
export type RenameReadingList = z.infer<typeof renameReadingList>;
export type GetReadingList = z.infer<typeof getReadingList>;
export type UpdateReadingList = z.infer<typeof updateReadingLists>;
export type GetUsers = z.infer<typeof read>;
