import type { HydratedDocument } from 'mongoose';
import type { Genres } from './genres';
import type { UserProperties } from './user';

export const label = 'Book';

export interface BookProperties {
	_id: string;
	user: string | HydratedDocument<UserProperties>;
	title?: string;
	description?: string;
	imageURL?: string;
	tags?: string[];
	genres?: Genres;
}
