import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from './user';
import { label as BookLabel } from '$lib/shared/book';
import { label as ChapterLabel } from '$lib/shared/chapter';
import { label as StorylineLabel } from '$lib/shared/storyline';
import { z } from 'zod';

export const label = 'Permission';

export const PermissionsEnum = ['view', 'comment', 'edit'] as const;
export type Permissions = (typeof PermissionsEnum)[number];

export const PermissionedDocumentsEnum = [BookLabel, ChapterLabel, StorylineLabel] as const;
export type PermissionedDocument = (typeof PermissionedDocumentsEnum)[number];

export interface PermissionProperties {
	_id: string;
	public: boolean;
	user?: string | HydratedDocument<UserProperties>;
	permission?: Permissions;
}

export class PermissionPropertyBuilder {
	private readonly _properties: PermissionProperties;

	constructor() {
		this._properties = {
			_id: '',
			public: false,
			permission: 'edit'
		};
	}

	getProperties() {
		return this._properties;
	}
}
