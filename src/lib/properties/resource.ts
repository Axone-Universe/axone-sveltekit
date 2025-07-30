import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import { type UserProperties } from './user';

export const label = 'Resource';

export const resourceTypes = ['image', 'video', 'audio', 'document'] as const;
export type ResourceType = (typeof resourceTypes)[number];

export const resourceCollections = ['characters', 'places', 'artifacts'] as const;
export type ResourceCollection = (typeof resourceCollections)[number];

export const resourceLicenses = [
	'None',
	'CC0 Public Domain',
	'CC BY',
	'CC BY-SA',
	'CC BY-NC',
	'CC BY-NC-SA',
	'CC BY-ND',
	'CC BY-NC-ND'
] as const;
export type ResourceLicense = (typeof resourceLicenses)[number];

export const resourceCollectionsData: Record<ResourceCollection, { taxon: number }> = {
	characters: { taxon: 1 },
	places: { taxon: 2 },
	artifacts: { taxon: 3 }
};

export type ResourceProperties = {
	_id: string;
	externalId?: string;
	price?: number;
	user?: string | HydratedDocument<UserProperties>;
	chapter?: string | HydratedDocument<ChapterProperties>;
	src?: string;
	alt?: string;
	type?: ResourceType;
	nftCollection?: ResourceCollection;
	title?: string;
	description?: string;
	properties?: { name: string; value: string }[];
	isListed?: boolean;
	isTokenized?: boolean;
	royalties?: number;
	license?: ResourceLicense;
};

export type HydratedResourceProperties = ResourceProperties & {
	user?: HydratedDocument<UserProperties>;
	chapter?: HydratedDocument<ChapterProperties>;
};
