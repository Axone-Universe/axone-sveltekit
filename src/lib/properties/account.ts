import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from './user';
import { type TransactionProperties } from './transaction';

export const label = 'Account';

export interface AccountProperties {
	_id: string;
	user?: string | HydratedDocument<UserProperties>;
	transactions?: TransactionProperties[];
	currency?: string;
	currencyScale?: number;
	balance?: number;
}
