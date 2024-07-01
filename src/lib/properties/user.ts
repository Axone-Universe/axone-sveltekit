import type { Genre } from './genre';

export const label = 'User';

export const USER_LABELS = ['Writer', 'Illustrator', 'Editor'] as const;
export const DEFAULT_READING_LIST = 'All';
export type UserLabel = (typeof USER_LABELS)[number];

export interface UserProperties {
	_id: string;
	firstName?: string;
	lastName?: string;
	about?: string;
	imageURL?: string;
	email?: string;
	facebook?: string;
	instagram?: string;
	twitter?: string;
	genres?: Genre[];
	labels?: UserLabel[];
	readingLists?: Map<string, string[]>;
	createdAt?: Date;
	updatedAt?: Date;
}

export class UserPropertyBuilder {
	private readonly _properties: UserProperties;

	constructor() {
		this._properties = {
			_id: '',
			firstName: '',
			lastName: '',
			about: '',
			email: '',
			facebook: '',
			instagram: '',
			twitter: '',
			labels: [],
			genres: [],
			readingLists: new Map([[DEFAULT_READING_LIST, []]])
		};
	}

	getProperties(): UserProperties {
		return this._properties;
	}
}
