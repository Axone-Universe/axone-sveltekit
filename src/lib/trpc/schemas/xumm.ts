import { z } from 'zod';
import { currencyCodes, transactionTypes, visibleDocuments } from '$lib/util/constants';
import { userNotification } from './notifications';

export const readRates = z.object({ currencyCode: z.string() });

export const createPayload = z.object({
	transactionType: z.enum(transactionTypes),
	netValue: z.number(),
	documentType: z.enum(visibleDocuments),
	documentId: z.string(),
	receiver: z.string(),
	note: z.string(),
	currency: z.enum(currencyCodes),
	notifications: z.record(z.string(), userNotification).optional()
});

export const buyToken = z.object({
	resourceId: z.string(),
	notifications: z.record(z.string(), userNotification).optional()
});

export type ReadRates = z.infer<typeof readRates>;
