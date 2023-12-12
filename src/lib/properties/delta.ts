import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import type { PermissionProperties } from './permission';
import { ulid } from 'ulid';
import type { UserProperties } from './user';

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
}

export class VersionPropertyBuilder {
	private readonly _properties: VersionProperties;

	constructor() {
		this._properties = {
			_id: ulid(),
			date: this.formatDate(new Date()),
			ops: []
		};
	}

	formatDate(date: Date) {
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric'
		});
	}

	getProperties() {
		return this._properties;
	}
}
