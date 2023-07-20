export const label = 'Delta';

export interface Genres {
	Action: boolean;
	Adventure: boolean;
	Dystopian: boolean;
	Fantasy: boolean;
	Historical: boolean;
	Horror: boolean;
	Mystery: boolean;
	Romance: boolean;
	'Science Fiction': boolean;
	Thriller: boolean;
	'Young Adult': boolean;
	Autobiographies: boolean;
	Biographies: boolean;
	Journalism: boolean;
	'Self-help': boolean;
	Science: boolean;
	'Travel Guides': boolean;
}

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
