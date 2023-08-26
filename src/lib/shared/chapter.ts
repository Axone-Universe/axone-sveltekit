import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from './book';
import type { UserProperties } from './user';
import type { DeltaProperties } from './delta';
import type { PermissionProperties } from './permission';
import type { Genres } from './genres';
import type { StorylineProperties } from './storyline';

export const label = 'Chapter';

export interface ChapterProperties {
	_id: string;
	book?: string | HydratedDocument<BookProperties>;
	storyline?: string | HydratedDocument<StorylineProperties>;
	user?: string | HydratedDocument<UserProperties>;
	delta?: string | HydratedDocument<DeltaProperties>;
	children?: string[] | HydratedDocument<ChapterProperties>[];
	published: boolean;
	permissions: Record<string, HydratedDocument<PermissionProperties>>;
	permissionsUsers?: HydratedDocument<UserProperties>[]; // List of all users given certain permissions to the document
	hasPermission?: boolean; // Boolean to see if current session user has permissions to view the document
	genres?: Genres;
	title?: string;
	description?: string;
}

export class ChapterPropertyBuilder {
	private readonly _properties: ChapterProperties;

	constructor() {
		this._properties = {
			_id: '',
			book: '',
			user: '',
			delta: '',
			children: [],
			title: '',
			description: '',
			permissions: {},
			published: false
		};
	}

	getProperties() {
		return this._properties;
	}
}
