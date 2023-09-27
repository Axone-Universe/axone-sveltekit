import type { HydratedDocument } from 'mongoose';
import { label as storylineLabel, type StorylineProperties } from './storyline';
import type { UserProperties } from './user';

export const label = 'Review';

export const REVIEW_OF = [storylineLabel] as const;
export type ReviewOf = (typeof REVIEW_OF)[number];

export const RATING = [1, 2, 3, 4, 5] as const;
export type Rating = (typeof RATING)[number];

export interface ReviewableProperties {
	cumulativeRating: number;
	numRatings: number;
}

export interface ReviewProperties {
	_id: string;
	item: string | HydratedDocument<StorylineProperties>;
	user: string | HydratedDocument<UserProperties>;
	reviewOf: ReviewOf;
	rating: Rating;
	title?: string;
	text?: string;
	createDate: Date;
}

export interface ReviewPropertiesPopulated extends ReviewProperties {
	_id: string;
	item: HydratedDocument<StorylineProperties>;
	user: HydratedDocument<UserProperties>;
	reviewOf: ReviewOf;
	rating: Rating;
	title: string;
	text: string;
	createDate: Date;
}

export class ReviewPropertyBuilder {
	private readonly _properties: ReviewProperties;

	constructor() {
		this._properties = {
			_id: '',
			item: '',
			user: '',
			reviewOf: 'Storyline',
			rating: 1,
			createDate: new Date()
		};
	}

	getProperties() {
		return this._properties;
	}
}
