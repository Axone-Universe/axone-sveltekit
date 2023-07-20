import { GenresBuilder, type Genres } from './genres';

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

export class UserPropertyBuilder {
	private readonly _properties: UserProperties;

	constructor() {
		const genresBuilder = new GenresBuilder();
		const genres = genresBuilder.getGenres();
		const labels: Users = { Writer: false, Illustrator: false, Editor: false };

		this._properties = {
			_id: '',
			firstName: '',
			lastName: '',
			about: '',
			facebook: '',
			instagram: '',
			twitter: '',
			labels: labels,
			genres: genres
		};
	}

	getProperties(): UserProperties {
		return this._properties;
	}
}
