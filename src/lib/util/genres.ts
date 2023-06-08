import type { Genres } from './types';

export class GenresBuilder {
	private readonly _genres: Genres;

	constructor() {
		this._genres = {
			Action: false,
			Adventure: false,
			Dystopian: false,
			Fantasy: false,
			Horror: false,
			Mystery: false,
			Romance: false,
			'Science Fiction': false,
			Thriller: false,
			'Young Adult': false,
			Autobiographies: false,
			Biographies: false,
			Historical: false,
			Journalism: false,
			'Self-help': false,
			Science: false,
			'Travel Guides': false
		};
	}

	action(set: boolean): GenresBuilder {
		this._genres.Action = set;
		return this;
	}

	genre(genre: keyof Genres): GenresBuilder {
		this._genres[genre] = true;
		return this;
	}

	getGenres() {
		return this._genres;
	}
}
