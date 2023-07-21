export interface DeltaQuery {
	id?: string;
	chapterID: string;
	ops?: string;
}

export interface CampaignProperties {
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
