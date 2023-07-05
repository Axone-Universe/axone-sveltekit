import { GenresBuilder } from './genres';
import type { BookProperties } from './types';

export class BookPropertyBuilder {
	private readonly _properties: BookProperties;

	constructor() {
		const genresBuilder = new GenresBuilder();
		const genres = genresBuilder.getGenres();

		this._properties = {
			id: '',
			title: '',
			description: '',
			imageURL: '',
			genres: genres,
			tags: []
		};
	}

	getProperties() {
		return this._properties;
	}
}
