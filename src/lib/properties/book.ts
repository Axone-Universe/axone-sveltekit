import type { HydratedDocument } from 'mongoose';
import type { Genre } from './genre';
import type { UserProperties } from './user';
import type { PermissionProperties } from './permission';
import type { CampaignProperties } from './campaign';
import { type StorylineProperties } from './storyline';

export const label = 'Book';

export type BookProperties = {
	_id: string;
	user: string | HydratedDocument<UserProperties>;
	title: string;
	description: string;
	imageURL: string;
	tags?: string[];
	storylines?: string[] | HydratedDocument<StorylineProperties>[];
	permissions: Record<string, HydratedDocument<PermissionProperties>>;
	permissionsUsers?: HydratedDocument<UserProperties>[];
	userPermissions?: { view: boolean; collaborate: boolean };
	genres?: Genre[];
	rating: number;
	archived?: boolean;
	campaign?: string | HydratedDocument<CampaignProperties>;
	createdAt?: Date;
	updatedAt?: Date;
};

export type HydratedBookProperties = BookProperties & {
	user: HydratedDocument<UserProperties>;
	campaign?: HydratedDocument<CampaignProperties>;
};

export class BookPropertyBuilder {
	private readonly _properties: BookProperties;

	constructor() {
		this._properties = {
			_id: '',
			title: '',
			user: '',
			description: '',
			imageURL: '',
			genres: [],
			tags: [],
			permissions: {
				public: { _id: 'public', permission: 'view' } as HydratedDocument<PermissionProperties>
			},
			rating: 0,
			archived: false
		};
	}

	getProperties() {
		return this._properties;
	}
}
