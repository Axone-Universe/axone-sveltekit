import type { Genres } from '$lib/documents/genres/genres';

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
