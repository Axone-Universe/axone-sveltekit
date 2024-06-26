import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import type { BookProperties } from './book';
import type { UserProperties } from './user';
import { GenresBuilder, type Genre } from './genre';
import type { PermissionProperties } from './permission';
import type { ReviewableProperties } from './review';

export const label = 'Storyline';

export interface StorylineProperties extends ReviewableProperties {
	_id: string;
	main: boolean;
	book?: string | HydratedDocument<BookProperties>;
	user?: string | HydratedDocument<UserProperties>;
	title?: string;
	chapters?: string[] | HydratedDocument<ChapterProperties>[];
	permissions: Record<string, HydratedDocument<PermissionProperties>>;
	permissionsUsers?: HydratedDocument<UserProperties>[];
	userPermissions?: { view: boolean; collaborate: boolean };
	description?: string;
	imageURL: string;
	tags?: string[];
	genres?: Genre[];
	parent?: string;
	parentChapter?: string;
	archived?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface HydratedStorylineProperties extends StorylineProperties {
	_id: string;
	main: boolean;
	book?: HydratedDocument<BookProperties>;
	user?: HydratedDocument<UserProperties>;
	title?: string;
	chapters?: HydratedDocument<ChapterProperties>[];
	permissions: Record<string, HydratedDocument<PermissionProperties>>;
	permissionsUsers?: HydratedDocument<UserProperties>[];
	userPermissions?: { view: boolean; collaborate: boolean };
	description?: string;
	imageURL: string;
	tags?: string[];
	genres?: Genre[];
	parent?: string;
	parentChapter?: string;
	archived?: boolean;
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
			permissions: {
				public: { _id: 'public', permission: 'view' } as HydratedDocument<PermissionProperties>
			},
			cumulativeRating: 0,
			numRatings: 0,
			archived: false
		};
	}

	getProperties() {
		return this._properties;
	}
}
