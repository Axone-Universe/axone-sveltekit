import { z } from 'zod';

import type {
	CreateCampaign,
	CreateUser,
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

export const createUserSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	about: z.string(),
	userWriterChecked: z.boolean(),
	userEditorChecked: z.boolean(),
	userIllustratorChecked: z.boolean(),
	facebook: z.string(),
	instagram: z.string(),
	twitter: z.string(),
	fictional: fictionalSchema,
	nonFictional: nonFictionalSchema
}) satisfies z.ZodType<CreateUser>;

export const createCampaignSchema = z.object({
	id: z.string(),
	title: z.string(),
	organizer: z.object({ name: z.string(), link: z.string() }),
	dates: z.array(
		z.object({ startDate: z.coerce.date(), endDate: z.coerce.date(), event: z.string() })
	),
	about: z.string(),
	tags: z.array(z.string()),
	bannerURL: z.string()
}) satisfies z.ZodType<CreateCampaign>;

export const listSchema = z.object({
	searchTerm: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});