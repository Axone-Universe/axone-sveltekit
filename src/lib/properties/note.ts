import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import type { PermissionProperties } from './permission';

export const label = 'Note';

export const TAGS = ['event', 'character', 'location', 'prop', 'extra', 'scene', 'other'] as const;

export type Tag = (typeof TAGS)[number];

export interface NoteProperties {
	_id: string;
	title: string;
	note?: string;
	chapter?: string | HydratedDocument<ChapterProperties>;
	permissions?: Record<string, HydratedDocument<PermissionProperties>>;
	tags?: Tag[];
}

export class NotePropertyBuilder {
	private readonly _properties: NoteProperties;

	constructor() {
		this._properties = {
			_id: '',
			title: '',
			note: '',
			chapter: '',
			tags: []
		};
	}

	getProperties() {
		return this._properties;
	}
}
