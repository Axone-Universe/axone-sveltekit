import { type TransactionStatus, type TransactionType } from '$lib/util/types';
import { type HydratedDocument } from 'mongoose';
import { type UserProperties } from './user';
import { type XummPostPayloadResponse } from 'xumm-sdk/dist/src/types';

export const label = 'Transaction';

export interface TransactionProperties {
	_id: string;
	sender?: string | HydratedDocument<UserProperties>;
	hash?: string;
	account?: string;
	externalId?: string;
	createdAt?: Date;
	processedAt?: Date;
	ref?: string;
	status?: TransactionStatus;
	type?: TransactionType;
	fee?: number;
	value?: number;
	netValue?: number;
	documentType?: string;
	documentId?: string;
	currency?: string;
	// this is the rate for the txn's currency convert to the account's currency
	exchangeRate?: number;
	note?: string;
	payload?: XummPostPayloadResponse;
	payloadId?: string;
}
