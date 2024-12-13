import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import type { PermissionProperties } from './permission';
import { ulid } from 'ulid';
import type { UserProperties } from './user';
import { formatDate } from '$lib/util/constants';

export const label = 'Delta';

export interface VersionProperties {
	_id: string;
	date: string;
	ops: object[];
	title?: string;
}

export interface DeltaProperties {
	_id: string;
	user?: string | HydratedDocument<UserProperties>;
	chapter?: string | HydratedDocument<ChapterProperties>;
	permissions?: Record<string, HydratedDocument<PermissionProperties>>;
	versions?: VersionProperties[];
	ops?: object;
	archived?: boolean;
	updatedAt?: Date;
}

export class VersionPropertyBuilder {
	private readonly _properties: VersionProperties;

	constructor() {
		this._properties = {
			_id: ulid(),
			date: formatDate(new Date()),
			ops: []
		};
	}

	getProperties() {
		return this._properties;
	}
}
