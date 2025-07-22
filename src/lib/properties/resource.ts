import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import { type ResourceType } from '$lib/util/types';
import { type UserProperties } from './user';

export const label = 'Resource';

export interface ResourceProperties {
	_id: string;
	user?: string | HydratedDocument<UserProperties>;
	chapter?: string | HydratedDocument<ChapterProperties>;
	src?: string;
	alt?: string;
	type?: ResourceType;
	title?: string;
	description?: string;
	metadata?: object;
}
