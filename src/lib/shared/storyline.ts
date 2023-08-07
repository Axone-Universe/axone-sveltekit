import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import type { BookProperties } from './book';
import type { UserProperties } from './user';
import { GenresBuilder, type Genres } from './genres';
import type { PermissionProperties } from './permission';

export const label = 'Storyline';

export interface StorylineProperties {
	_id: string;
	main: boolean;
	book?: string | HydratedDocument<BookProperties>;
	user?: string | HydratedDocument<UserProperties>;
	title?: string;
	chapters?: string[] | HydratedDocument<ChapterProperties>[];
	permissions?: HydratedDocument<PermissionProperties>[];
	description?: string;
	imageURL?: string;
	tags?: string[];
	genres?: Genres;
	parent?: string;
	parentChapter?: string;
}

export class StorylinePropertyBuilder {
	private readonly _properties: StorylineProperties;

	constructor() {
		const genresBuilder = new GenresBuilder();
		const genres = genresBuilder.getGenres();

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
			tags: []
		};
	}

	getProperties() {
		return this._properties;
	}
}
