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

export interface CreateUser {
	firstName: string;
	lastName: string;
	id?: string;
	imageURL?: string;
	about?: string;
	userWriterChecked?: boolean;
	userEditorChecked?: boolean;
	userIllustratorChecked?: boolean;
	facebook?: string;
	instagram?: string;
	twitter?: string;
	genres?: Genres;
}

export interface DeltaQuery {
	id?: string;
	chapterID: string;
	ops?: string;
}

export interface BookProperties {
	id: string;
	title: string;
	description: string;
	imageURL: string;
	genres: Genres;
	tags: string[];
}
export interface StorylineProperties {
	id: string;
	bookID: string;
	title: string;
	description: string;
	imageURL: string;
	genres: Genres;
	tags: string[];
	parentStorylineID?: string;
	branchOffChapterID?: string;
}

export interface CreateCampaign {
	id?: string;
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
	submissionCriteria: string;
	rewards: string;
	previewText: string;
}

export interface NodeRelationship {
	name: string;
	label: string;
}

export type StorageError =
	| { data: { path: string }; error: null }
	| { data: null; error: { name: string; statusCode?: string } };
