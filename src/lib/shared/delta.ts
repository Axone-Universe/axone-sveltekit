import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import type { PermissionProperties } from './permission';

export const label = 'Delta';

export interface DeltaProperties {
	_id: string;
	chapter?: string | HydratedDocument<ChapterProperties>;
	permissions?: Record<string, HydratedDocument<PermissionProperties>>;
	ops?: object;
}
