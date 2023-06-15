import { z } from 'zod';
import { genres } from './shared';

export const create = z.object({
	title: z.string(),
	description: z.string(),
	imageURL: z.string(),
	genres: genres.optional()
});

export const submitToCampaign = z.object({
	bookID: z.string(),
	campaignID: z.string()
});
