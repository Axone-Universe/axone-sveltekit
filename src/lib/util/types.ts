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

export interface CreateUser {
	firstName: string;
	lastName: string;
	imageUrl?: string;
	about?: string;
	userWriterChecked?: boolean;
	userEditorChecked?: boolean;
	userIllustratorChecked?: boolean;
	facebook?: string;
	instagram?: string;
	twitter?: string;
	fictional?: FictionalGenres;
	nonFictional?: NonFictionalGenres;
}

export interface CreateCampaign {
	id: string;
	title: string;
	organizer: { name: string; link: string };
	dates: {
		startDate: Date;
		endDate: Date;
		event: string;
	}[];
	about: string;
	tags: string[];
	bannerURL: string;
}
