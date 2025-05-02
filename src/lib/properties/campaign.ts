import { HydratedDocument } from 'mongoose';
import { type BookProperties } from './book';
import { type UserProperties } from './user';

export const label = 'Campaign';

export interface CampaignProperties {
	_id: string;
	user: string;
	startDate?: Date;
	endDate?: Date;
	submissionCriteria?: string;
	resources?: { value: string; link: string }[];
	criteria?: { value: string; link: string }[];
	rewards?: { value: string; link: string }[];
	winners?: string[] | HydratedDocument<UserProperties>[];
	book?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface HydratedCampaignProperties {
	_id: string;
	user: string;
	startDate?: Date;
	endDate?: Date;
	submissionCriteria?: string;
	resources?: { value: string; link: string }[];
	criteria?: { value: string; link: string }[];
	rewards?: { value: string; link: string }[];
	winners?: HydratedDocument<UserProperties>[];
	book: HydratedDocument<BookProperties>;
	createdAt?: Date;
	updatedAt?: Date;
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
			resources: [],
			criteria: [],
			rewards: [],
			winners: [],
			book: ''
		};
	}

	getProperties() {
		return this._properties;
	}
}
