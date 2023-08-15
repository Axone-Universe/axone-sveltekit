import { z } from 'zod';
import type { Genres } from '$lib/shared/genres';

export const genres = z.object({
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

export const search = z.object({
	searchTerm: z.string().optional(),
	limit: z.number().optional(),
	skip: z.number().optional()
});
