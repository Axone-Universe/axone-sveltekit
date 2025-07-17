import { z } from 'zod';
import { currencyCodes, transactionTypes } from '$lib/util/constants';
import { PermissionedDocumentsEnum } from '$lib/properties/permission';
export const readRates = z.object({ currencyCode: z.string() });

export const createPayload = z.object({
	transactionType: z.enum(transactionTypes),
	value: z.number(),
	netValue: z.number(),
	documentType: z.enum(PermissionedDocumentsEnum),
	documentId: z.string(),
	receiver: z.string(),
	note: z.string(),
	fee: z.number(),
	currency: z.enum(currencyCodes)
});

export type ReadRates = z.infer<typeof readRates>;
