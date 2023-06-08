import { z } from 'zod';

import type {
	CreateCampaign,
	CreateUser,
	Genres,
	FictionalGenres,
	NonFictionalGenres
} from '$lib/util/types';

const fictionalSchema = z.object({
	'Action & Adventure': z.boolean(),
	Dystopian: z.boolean(),
	Fantasy: z.boolean(),
	Historical: z.boolean(),
	Horror: z.boolean(),
	Mystery: z.boolean(),
	Romance: z.boolean(),
	'Science Fiction': z.boolean(),
	Thriller: z.boolean(),
	'Young Adult': z.boolean()
}) satisfies z.ZodType<FictionalGenres>;

const nonFictionalSchema = z.object({
	Autobiographies: z.boolean(),
	Biographies: z.boolean(),
	Historical: z.boolean(),
	Journalism: z.boolean(),
	'Self-help': z.boolean(),
	Science: z.boolean(),
	'Travel Guides': z.boolean()
}) satisfies z.ZodType<NonFictionalGenres>;

const genresSchema = z.object({
	Action: z.boolean(),
	Adventure: z.boolean(),
	Dystopian: z.boolean(),
	Fantasy: z.boolean(),
	Historical: z.boolean(),
	Horror: z.boolean(),
	Mystery: z.boolean(),
	Romance: z.boolean(),
	'Science Fiction': z.boolean(),
	Thriller: z.boolean(),
	'Young Adult': z.boolean(),
	Autobiographies: z.boolean(),
	Biographies: z.boolean(),
	Journalism: z.boolean(),
	'Self-help': z.boolean(),
	Science: z.boolean(),
	'Travel Guides': z.boolean()
}) satisfies z.ZodType<Genres>;

export const createUserSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	imageURL: z.string().optional(),
	about: z.string().optional(),
	userWriterChecked: z.boolean().optional(),
	userEditorChecked: z.boolean().optional(),
	userIllustratorChecked: z.boolean().optional(),
	facebook: z.string().optional(),
	instagram: z.string().optional(),
	twitter: z.string().optional(),
	genres: genresSchema.optional()
}) satisfies z.ZodType<CreateUser>;

export const createCampaignSchema = z.object({
	title: z.string(),
	organizer: z.object({ name: z.string(), link: z.string() }),
	dates: z.array(
		z.object({ startDate: z.coerce.date(), endDate: z.coerce.date(), event: z.string() })
	),
	about: z.string(),
	tags: z.array(z.string()),
	bannerURL: z.string(),
	submissionCriteria: z.string(),
	rewards: z.string(),
	previewText: z.string()
}) satisfies z.ZodType<CreateCampaign>;

export const listSchema = z.object({
	searchTerm: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});

export const createBookSchema = z.object({
	title: z.string(),
	imageURL: z.string(),
	genres: genresSchema.optional()
});

export const submitToCampaignSchema = z.object({
	bookID: z.string(),
	campaignID: z.string()
});
