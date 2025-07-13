import { z } from 'zod';
import { transactionTypes } from '$lib/util/constants';
export const readRates = z.object({ currencyCode: z.string() });

export const createPayload = z.object({
	transactionType: z.enum(transactionTypes),
	value: z.number(),
	netValue: z.number(),
	documentType: z.string(),
	documentId: z.string(),
	receiver: z.string(),
	note: z.string(),
	fee: z.number(),
	currency: z.string(),
	exchangeRate: z.number()
});

export type ReadRates = z.infer<typeof readRates>;
