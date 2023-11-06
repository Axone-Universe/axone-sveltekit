import { z } from 'zod';
import { genreSchema } from './genres';
import { permissions } from './permissions';
import { userNotification } from './notifications';

export const create = z.object({
	title: z.string(),
	description: z.string(),
	imageURL: z.string(),
	genres: genreSchema.optional(),
	permissions: z.record(z.string(), permissions).optional(),
	notifications: z.record(z.string(), userNotification).optional()
});

export const read = z.object({
	limit: z.number().optional(),
	cursor: z.string().optional(),
	genres: genreSchema.optional(),
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
	permissions: z.record(z.string(), permissions).optional(),
	notifications: z.record(z.string(), userNotification).optional()
});

export const submitToCampaign = z.object({
	bookID: z.string(),
	campaignID: z.string()
});

export const search = z.object({
	limit: z.number().optional(),
	cursor: z.string().optional(),
	genres: genreSchema.optional(),
	title: z.string().optional(),
	id: z.string().optional()
});
