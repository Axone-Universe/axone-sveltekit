import { z } from 'zod';
import { genres } from './shared';
import { permissions } from './permissions';

export const create = z.object({
	title: z.string(),
	description: z.string(),
	imageURL: z.string(),
	genres: genres.optional(),
	permissions: z.record(z.string(), permissions).optional()
});

export const update = z.object({
	id: z.string(),
	title: z.string().optional(),
	description: z.string().optional(),
	imageURL: z.string().optional(),
	genres: genres.optional(),
	permissions: z.map(z.string(), permissions).optional()
});

export const submitToCampaign = z.object({
	bookID: z.string(),
	campaignID: z.string()
});
