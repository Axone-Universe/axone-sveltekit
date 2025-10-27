export const label = 'Delta';

export const GENRES = [
	'Action',
	'Adventure',
	'Chick Lit',
	"Children's Fiction",
	'Coming of Age',
	'Contemporary Fiction',
	'Crime',
	'Cyberpunk',
	'Drama',
	'Dystopian',
	'Erotica',
	'Fan Fiction',
	'Fantasy',
	'Gothic',
	'Historical',
	'Historical Romance',
	'Horror',
	'Humor',
	'Literary Fiction',
	'Magical Realism',
	'Memoir',
	'Middle Grade',
	'Mystery',
	'Mythology',
	'New Adult',
	'Paranormal',
	'Poetry',
	'Post-Apocalyptic',
	'Romance',
	'Satire',
	'Science Fiction',
	'Short Stories',
	'Spy/Espionage',
	'Steampunk',
	'Superhero',
	'Suspense',
	'Thriller',
	'Urban Fantasy',
	'Western',
	"Women's Fiction",
	'Young Adult',
	// Non-Fiction
	'Arts & Photography',
	'Autobiographies',
	'Biographies',
	'Business',
	'Cooking',
	'Essays',
	'Health & Fitness',
	'History',
	'Journalism',
	'Parenting',
	'Philosophy',
	'Politics',
	'Psychology',
	'Religion & Spirituality',
	'Science',
	'Self-help',
	'Teen Fiction',
	'Travel Guides',
	'True Crime'
] as const;

export type Genre = (typeof GENRES)[number];

export class GenresBuilder {
	private readonly _genres: Genre[];

	constructor() {
		this._genres = [];
	}

	all() {
		GENRES.forEach((genre: Genre) => {
			this._genres.push(genre);
		});

		return this;
	}

	reset() {
		this._genres.splice(0, this._genres.length);

		return this;
	}

	toggle(genre: Genre): GenresBuilder {
		const index = this._genres.indexOf(genre);
		if (index > -1) {
			this._genres.splice(index, 1);
		} else {
			this._genres.push(genre);
		}

		return this;
	}

	with(genre: Genre): GenresBuilder {
		if (!this._genres.includes(genre)) {
			this._genres.push(genre);
		}

		return this;
	}

	without(genre: Genre): GenresBuilder {
		const index = this._genres.indexOf(genre);
		if (index > -1) {
			this._genres.splice(index, 1);
		}

		return this;
	}

	withList(genres: Genre[]): GenresBuilder {
		this.reset();
		for (const genre of genres) {
			this.with(genre);
		}

		return this;
	}

	random(weight: number) {
		if (weight < 0 || weight > 1) {
			throw Error('Weight should be between 0 and 1');
		}

		GENRES.forEach((genre: Genre) => {
			if (Math.random() <= weight) {
				this._genres.push(genre);
			}
		});

		// Make sure we always have at least one genre
		if (this._genres.length === 0) {
			this._genres.push('Action');
		}

		return this;
	}

	build() {
		return this._genres;
	}
}
