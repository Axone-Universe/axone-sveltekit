import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from './user';
import { label as BookLabel } from '$lib/properties/book';
import { label as ChapterLabel } from '$lib/properties/chapter';
import { label as StorylineLabel } from '$lib/properties/storyline';

export const label = 'Permission';

export const PermissionsEnum = ['view', 'collaborate'] as const;
export type Permissions = (typeof PermissionsEnum)[number];

export const PermissionedDocumentsEnum = [BookLabel, ChapterLabel, StorylineLabel] as const;
export type PermissionedDocument = (typeof PermissionedDocumentsEnum)[number];

export interface PermissionProperties {
	_id: string;
	user?: string | HydratedDocument<UserProperties>;
	permission?: Permissions;
}

export class PermissionPropertyBuilder {
	private readonly _properties: PermissionProperties;

	constructor() {
		this._properties = {
			_id: 'public',
			permission: 'view'
		};
	}

	getProperties() {
		return this._properties;
	}
}
