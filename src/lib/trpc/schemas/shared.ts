import { z } from 'zod';
import { GENRES } from '$lib/properties/genre';

const GenreEnum = z.enum(GENRES);

export const genreSchema = z.array(GenreEnum);

export const search = z.object({
	limit: z.number().optional(),
	cursor: z.number().optional(),
	skip: z.number().optional(),
	searchTerm: z.string().optional(),
	genres: genreSchema.optional(),
	title: z.string().optional()
});

export const setArchived = z.object({
	ids: z.array(z.string()),
	archived: z.boolean()
});
