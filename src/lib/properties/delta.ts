import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import type { PermissionProperties } from './permission';

export const label = 'Delta';

export interface VersionProperties {
	date: string;
	title: string;
	ops?: object;
}

export interface DeltaProperties {
	_id: string;
	chapter?: string | HydratedDocument<ChapterProperties>;
	permissions?: Record<string, HydratedDocument<PermissionProperties>>;
	versions?: VersionProperties[];
	ops?: object;
}
