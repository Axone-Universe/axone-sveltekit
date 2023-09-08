import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import type { BookProperties } from './book';
import type { UserProperties } from './user';
import { GenresBuilder, type Genre } from './genre';
import type { PermissionProperties } from './permission';

export const label = 'Storyline';

export interface StorylineProperties {
	_id: string;
	main: boolean;
	book?: string | HydratedDocument<BookProperties>;
	user?: string | HydratedDocument<UserProperties>;
	title?: string;
	chapters?: string[] | HydratedDocument<ChapterProperties>[];
	published: boolean;
	permissions: Record<string, HydratedDocument<PermissionProperties>>;
	permissionsUsers?: HydratedDocument<UserProperties>[];
	userPermissions?: { view: boolean; edit: boolean; comment: boolean };
	description?: string;
	imageURL?: string;
	tags?: string[];
	genres?: Genre[];
	parent?: string;
	parentChapter?: string;
}

export class StorylinePropertyBuilder {
	private readonly _properties: StorylineProperties;

	constructor() {
		const genresBuilder = new GenresBuilder();
		const genres = genresBuilder.build();

		this._properties = {
			_id: '',
			main: false,
			book: '',
			user: '',
			title: '',
			description: '',
			imageURL: '',
			genres: genres,
			parent: '',
			parentChapter: '',
			tags: [],
			permissions: {},
			published: true
		};
	}

	getProperties() {
		return this._properties;
	}
}
