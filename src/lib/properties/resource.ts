import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import { type UserProperties } from './user';

export const label = 'Resource';

export const resourceTypes = ['image', 'video', 'audio', 'document'] as const;
export type ResourceType = (typeof resourceTypes)[number];

export const resourceCollections = ['characters', 'places', 'artifacts'] as const;
export type ResourceCollection = (typeof resourceCollections)[number];

export type ResourceProperties = {
	_id: string;
	externalId?: string;
	price?: number;
	user?: string | HydratedDocument<UserProperties>;
	chapter?: string | HydratedDocument<ChapterProperties>;
	src?: string;
	alt?: string;
	type?: ResourceType;
	collection?: ResourceCollection;
	title?: string;
	description?: string;
	properties?: { name: string; value: string }[];
	isListed?: boolean;
	isTokenized?: boolean;
	royalties?: number;
};

export type HydratedResourceProperties = ResourceProperties & {
	user?: HydratedDocument<UserProperties>;
	chapter?: HydratedDocument<ChapterProperties>;
};
