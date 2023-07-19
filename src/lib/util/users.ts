import type { UserProperties, Users } from '$lib/documents/user';
import { GenresBuilder } from './genres';

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
