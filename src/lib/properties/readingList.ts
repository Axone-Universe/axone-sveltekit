import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import type { PermissionProperties } from './permission';
import type { UserProperties } from './user';
import type { BookProperties } from './book';

export const label = 'ReadingList';

export const TAGS = ['event', 'character', 'location', 'prop', 'extra', 'scene', 'other'] as const;

export type Tag = (typeof TAGS)[number];

export interface ReadingListProperties {
	_id: string;
	title: string;
	user?: string | HydratedDocument<UserProperties>;
	books?: string[] | HydratedDocument<BookProperties>[];
}

export class ReadingListPropertyBuilder {
	private readonly _properties: ReadingListProperties;

	constructor() {
		this._properties = {
			_id: '',
			title: '',
			user: '',
			books: []
		};
	}

	getProperties() {
		return this._properties;
	}
}
