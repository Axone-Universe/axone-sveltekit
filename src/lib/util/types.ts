export interface FictionalGenres extends Record<string, boolean> {
	'Action & Adventure': boolean;
	Dystopian: boolean;
	Fantasy: boolean;
	Historical: boolean;
	Horror: boolean;
	Mystery: boolean;
	Romance: boolean;
	'Science Fiction': boolean;
	Thriller: boolean;
	'Young Adult': boolean;
}

export interface NonFictionalGenres extends Record<string, boolean> {
	Autobiographies: boolean;
	Biographies: boolean;
	Historical: boolean;
	Journalism: boolean;
	'Self-help': boolean;
	Science: boolean;
	'Travel Guides': boolean;
}
