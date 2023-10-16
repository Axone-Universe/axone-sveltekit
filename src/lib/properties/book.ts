import type { HydratedDocument } from 'mongoose';
import type { Genre } from './genre';
import type { UserProperties } from './user';
import type { PermissionProperties } from './permission';

export const label = 'Book';

export interface BookProperties {
	_id: string;
	user: string | HydratedDocument<UserProperties>;
	title: string;
	description: string;
	imageURL: string;
	tags?: string[];
	permissions: Record<string, HydratedDocument<PermissionProperties>>;
	permissionsUsers?: HydratedDocument<UserProperties>[];
	userPermissions?: { view: boolean; edit: boolean; comment: boolean };
	genres?: Genre[];
	rating: number;
}

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
			rating: 0
		};
	}

	getProperties() {
		return this._properties;
	}
}
