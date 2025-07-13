import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from './chapter';
import type { PermissionProperties } from './permission';
import { ulid } from 'ulid';
import type { UserProperties } from './user';
import { TransactionProperties } from './transaction';

export const label = 'Account';

export interface AccountProperties {
	_id: string;
	user?: string | HydratedDocument<UserProperties>;
	transactions?: TransactionProperties[];
	currency?: string;
	currencyScale?: number;
	balance?: number;
}
