import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from './book';
import type { UserProperties } from './user';
import type { DeltaProperties } from './delta';
import type { PermissionProperties } from './permission';
import type { Genre } from './genre';
import type { StorylineProperties } from './storyline';

export const label = 'Chapter';

export interface ChapterProperties {
	_id: string;
	clonedChapter?: string | HydratedDocument<ChapterProperties>; // Only the branch off chapter is cloned when a storyline branches off another
	book?: string | HydratedDocument<BookProperties>;
	storyline?: string | HydratedDocument<StorylineProperties>;
	user?: string | HydratedDocument<UserProperties>; // owner of the chapter
	creator?: string | HydratedDocument<UserProperties>; // created the chapter
	delta?: string | HydratedDocument<DeltaProperties>;
	children?: string[] | HydratedDocument<ChapterProperties>[];
	permissions: Record<string, HydratedDocument<PermissionProperties>>;
	permissionsUsers?: HydratedDocument<UserProperties>[]; // List of all users given certain permissions to the document
	userPermissions?: { view: boolean; collaborate: boolean }; // Has the current session user permission details
	genres?: Genre[];
	title?: string;
	description?: string;
	archived?: boolean;
}

export interface HydratedChapterProperties extends ChapterProperties {
	clonedChapter?: HydratedDocument<ChapterProperties>;
	book?: HydratedDocument<BookProperties>;
	storyline?: HydratedDocument<StorylineProperties>;
	user?: HydratedDocument<UserProperties>;
	creator?: HydratedDocument<UserProperties>;
	delta?: HydratedDocument<DeltaProperties>;
	children?: HydratedDocument<ChapterProperties>[];
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
			permissions: {
				public: { _id: 'public', permission: 'view' } as HydratedDocument<PermissionProperties>
			},
			archived: false
		};
	}

	getProperties() {
		return this._properties;
	}
}
