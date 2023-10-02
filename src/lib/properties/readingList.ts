export const label = 'ReadingList';

export const DEFAULT = ['Finished Reading', 'Currently Reading', 'Future Reading'] as const;

export type Tag = (typeof DEFAULT)[number];

export interface ReadingListProperties {
	title: string;
	books: Record<string, string>;
}

export class ReadingListPropertyBuilder {
	private readonly _properties: ReadingListProperties;

	constructor() {
		this._properties = {
			title: '',
			books: {}
		};
	}

	getProperties() {
		return this._properties;
	}
}
