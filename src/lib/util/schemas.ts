import { z } from 'zod';

import type { FictionalGenres, NonFictionalGenres } from '$lib/util/types';

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

export const formDataSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	about: z.string().optional(),
	userWriterChecked: z.boolean().optional(),
	userEditorChecked: z.boolean().optional(),
	userIllustratorChecked: z.boolean().optional(),
	facebook: z.string().optional(),
	instagram: z.string().optional(),
	twitter: z.string().optional(),
	fictional: fictionalSchema.optional(),
	nonFictional: nonFictionalSchema.optional()
});
