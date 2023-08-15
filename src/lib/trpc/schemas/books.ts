import { z } from 'zod';
import { genres } from './shared';
import { permissions } from './permissions';

export const create = z.object({
	title: z.string(),
	description: z.string(),
	imageURL: z.string(),
	genres: genres.optional(),
	permissions: z.array(permissions).optional()
});

export const submitToCampaign = z.object({
	bookID: z.string(),
	campaignID: z.string()
});
