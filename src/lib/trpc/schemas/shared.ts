import { z } from 'zod';
import { GENRES } from '$lib/properties/genre';

const GenreEnum = z.enum(GENRES);

export const genreSchema = z.array(GenreEnum);

export const search = z.object({
	searchTerm: z.string().optional(),
	limit: z.number().optional(),
	cursor: z.string().optional(),
	genres: genreSchema.optional(),
	title: z.string().optional()
});

export const setArchived = z.object({
	id: z.string(),
	archived: z.boolean()
});