import { type CurrencyCode, type TransactionStatus, type TransactionType } from '$lib/util/types';
import { type HydratedDocument } from 'mongoose';
import { type UserProperties } from './user';
import { type XummPostPayloadResponse } from 'xumm-sdk/dist/src/types';

export const label = 'Transaction';

export type TransactionProperties = {
	_id: string;
	sender?: string | HydratedDocument<UserProperties>;
	receiver?: string | HydratedDocument<UserProperties>;
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
	// base values are the values in the account's currency
	baseValue?: number;
	baseNetValue?: number;
	documentType?: string;
	documentId?: string;
	currency?: CurrencyCode;
	currencyScale?: number;
	// exchange rate is accountCurrency/transactionCurrency e.g. USD/XRP
	// you derive transaction values from base values by multiplication i.e. value = baseValue * exchangeRate
	exchangeRate?: number;
	note?: string;
	payload?: XummPostPayloadResponse;
	payloadId?: string;
};

export type HydratedTransactionProperties = TransactionProperties & {
	sender?: HydratedDocument<UserProperties>;
	receiver?: HydratedDocument<UserProperties>;
};
