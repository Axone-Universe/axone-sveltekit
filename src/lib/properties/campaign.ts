export const label = 'Campaign';

export interface CampaignProperties {
	// preview + main
	_id: string;
	title?: string;
	organizer?: string;
	dates?: string[];
	previewText?: string;
	tags?: string[];
	bannerURL?: string;
	// main
	submissionCriteria?: string;
	rewards?: string;
	about?: string;
}
