export const label = 'Campaign';

export interface CampaignProperties {
	_id: string;
	user: string;
	startDate?: Date;
	endDate?: Date;
	submissionCriteria?: string;
	rewards?: string;
	book?: string;
}

export class CampaignPropertyBuilder {
	private readonly _properties: CampaignProperties;

	constructor() {
		this._properties = {
			_id: '',
			user: '',
			startDate: new Date(),
			endDate: new Date(),
			submissionCriteria: '',
			rewards: '',
			book: ''
		};
	}

	getProperties() {
		return this._properties;
	}
}
