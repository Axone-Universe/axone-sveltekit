import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';

export const label = 'Delta';

export interface DeltaProperties {
	_id: string;
	chapter?: string | HydratedDocument<ChapterProperties>;
	ops?: object;
}
