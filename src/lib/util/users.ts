import type { UserNode } from '$lib/nodes/user';
import { GenresBuilder } from './genres';
import type { Genres, UserProperties } from './types';

export class UserPropertyBuilder {
	private readonly _properties: UserProperties;

	constructor() {
		const genresBuilder = new GenresBuilder();
		const genres = genresBuilder.getGenres();

		this._properties = {
			firstName: '',
			lastName: '',
			about: '',
			userWriterChecked: false,
			userEditorChecked: false,
			userIllustratorChecked: false,
			facebook: '',
			instagram: '',
			twitter: '',
			genres: genres
		};
	}

	getProperties(): UserProperties {
		return this._properties;
	}

	createProperties(userNode: UserNode): UserProperties {
		const nodeProperties = userNode.properties;
		const properties = this._properties;
		const genres = properties.genres as unknown as Record<string, boolean>;

		userNode.properties.genres?.forEach((genre) => (genres[genre] = true));

		properties.firstName = nodeProperties.firstName ?? '';
		properties.lastName = nodeProperties.lastName ?? '';
		properties.about = nodeProperties.about ?? '';
		properties.userWriterChecked = userNode.labels.indexOf('Writer') !== -1 ? true : false;
		properties.userEditorChecked = userNode.labels.indexOf('Editor') !== -1 ? true : false;
		properties.userIllustratorChecked =
			userNode.labels.indexOf('Illustrator') !== -1 ? true : false;
		properties.facebook = userNode.properties.facebook ?? '';
		properties.instagram = userNode.properties.instagram ?? '';
		properties.twitter = userNode.properties.twitter ?? '';
		properties.genres = genres as unknown as Genres;

		return properties;
	}
}
