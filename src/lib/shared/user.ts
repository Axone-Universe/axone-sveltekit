import type { Genres } from './genres';

export const label = 'User';

export interface UserProperties {
	_id: string;
	firstName?: string;
	lastName?: string;
	about?: string;
	imageURL?: string;
	facebook?: string;
	instagram?: string;
	twitter?: string;
	genres?: Genres;
	labels?: Users;
}

export interface Users {
	Writer: boolean;
	Illustrator: boolean;
	Editor: boolean;
}
