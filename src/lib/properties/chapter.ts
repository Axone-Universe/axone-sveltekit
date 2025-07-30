import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from './book';
import type { UserProperties } from './user';
import type { DeltaProperties } from './delta';
import type { PermissionProperties } from './permission';
import type { Genre } from './genre';
import type { StorylineProperties } from './storyline';
import type { NoteProperties } from './note';

export const label = 'Chapter';

export interface CommentProperties {
	_id: string;
	date: string;
	userId: string;
	firstName: string;
	lastName: string;
	imageURL: string;
	comment: string;
}

export type ChapterProperties = {
	_id: string;
	book?: string | HydratedDocument<BookProperties>;
	storyline?: string | HydratedDocument<StorylineProperties>;
	user?: string | HydratedDocument<UserProperties>;
	delta?: string | HydratedDocument<DeltaProperties>;
	children?: string[] | HydratedDocument<ChapterProperties>[];
	permissions: Record<string, HydratedDocument<PermissionProperties>>;
	permissionsUsers?: HydratedDocument<UserProperties>[]; // List of all users given certain permissions to the document
	userPermissions?: { view: boolean; collaborate: boolean }; // Has the current session user permission details
	chapterNotes?: HydratedDocument<NoteProperties>[];
	comments?: CommentProperties[];
	commentsCount?: number;
	genres?: Genre[];
	title?: string;
	description?: string;
	archived?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
};

export type HydratedChapterProperties = ChapterProperties & {
	_id: string;
	book?: HydratedDocument<BookProperties>;
	storyline?: HydratedDocument<StorylineProperties>;
	user?: HydratedDocument<UserProperties>;
	delta?: HydratedDocument<DeltaProperties>;
	children?: HydratedDocument<ChapterProperties>[];
};

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
