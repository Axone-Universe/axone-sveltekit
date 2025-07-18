import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from './user';
import { type TransactionProperties } from './transaction';
import { type CurrencyCode } from '$lib/util/types';

export const label = 'Account';

export interface AccountProperties {
	_id: string;
	user?: string | HydratedDocument<UserProperties>;
	transactions?: TransactionProperties[];
	currency?: CurrencyCode;
	currencyScale?: number;
	balance?: number;
}
