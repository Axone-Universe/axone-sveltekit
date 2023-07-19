import type { Genres } from '$lib/shared/genres';
import { Schema } from 'mongoose';

export const genresSchemaProperties = {
	Action: Boolean,
	Adventure: Boolean,
	Dystopian: Boolean,
	Fantasy: Boolean,
	Historical: Boolean,
	Horror: Boolean,
	Mystery: Boolean,
	Romance: Boolean,
	'Science Fiction': Boolean,
	Thriller: Boolean,
	'Young Adult': Boolean,
	Autobiographies: Boolean,
	Biographies: Boolean,
	Journalism: Boolean,
	'Self-help': Boolean,
	Science: Boolean,
	'Travel Guides': Boolean
};

export const genresSchema = new Schema<Genres>(genresSchemaProperties);
