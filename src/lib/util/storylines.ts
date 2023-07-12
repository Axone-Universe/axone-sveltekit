import { GenresBuilder } from './genres';
import type { StorylineProperties } from './types';

export class StorylinePropertyBuilder {
	private readonly _properties: StorylineProperties;

	constructor() {
		const genresBuilder = new GenresBuilder();
		const genres = genresBuilder.getGenres();

		this._properties = {
			id: '',
			bookID: '',
			title: '',
			description: '',
			imageURL: '',
			genres: genres,
			parentStorylineID: '',
			branchOffChapterID: '',
			tags: []
		};
	}

	getProperties() {
		return this._properties;
	}
}
