import { z } from 'zod';
import { GENRES } from '$lib/properties/genre';

const GenreEnum = z.enum(GENRES);
export const genreSchema = z.array(GenreEnum);
