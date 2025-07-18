import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import type { Response } from '$lib/util/types';
import { AXONE_XRPL_ADDRESS } from '$env/static/private';
import { PUBLIC_PLATFORM_FEES } from '$env/static/public';
import { type Payment, xrpToDrops } from 'xrpl';
import { xummSdk } from '$lib/services/xumm';

import { RatesResponse } from 'xumm-sdk/dist/src/types';
import { createPayload, readRates } from '../schemas/xumm';
import { AccountsRepository } from '$lib/repositories/accountsRepository';
import { TransactionBuilder } from '$lib/documents/transaction';
import { HydratedTransactionProperties } from '$lib/properties/transaction';
import { HydratedDocument } from 'mongoose';
import { auth } from '../middleware/auth';
import { currencies } from '$lib/util/constants';

export const xumm = t.router({
	getRates: t.procedure
		.use(logger)
		.use(auth)
		.input(readRates)
		.query(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'rates successfully obtained',
				data: {}
			};

			try {
				const rates = await xummSdk!.getRates(input.currencyCode);
				response.data = rates;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as RatesResponse } };
		}),
	payload: t.procedure
		.use(logger)
		.use(auth)
		.input(createPayload)
		.query(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'payload successfully created',
				data: {}
			};
			const accountRepo = new AccountsRepository();

			console.log('<< create payload input');
			console.log(input);

			// get account of receiver or create one if not found
			const account = await accountRepo.getByUserId(input.receiver, true);

			// get the exchange rate
			const rates = await xummSdk!.getRates(account.currency!);
			const accountCurrencyToXrpExchangeRate = rates.XRP;

			// calculate the fees
			const currencyScale = currencies[input.currency].scale;
			const fees = (input.netValue * Number(PUBLIC_PLATFORM_FEES)).toFixed(currencyScale);

			console.log('<< account');
			console.log(account);

			// create the transaction
			const transactionBuilder = new TransactionBuilder()
				.accountId(account._id)
				.receiverID(input.receiver)
				.senderID(ctx.session!.user.id)
				.exchangeRate(accountCurrencyToXrpExchangeRate)
				.accountCurrency(account.currency!)
				// It's XRP because we are using the XUMM API
				.currency('XRP')
				.fee(Number(fees))
				.netValue(input.netValue)
				.documentId(input.documentId)
				.documentType(input.documentType)
				.note(input.note)
				.type(input.transactionType)
				.xrplType('Payment');

			const transaction = await transactionBuilder.build();

			console.log('<< txn created');
			console.log(transaction);

			try {
				const xrpTransaction = {
					TransactionType: transaction.xrplType,
					Amount: xrpToDrops(transaction.value!),
					Destination: AXONE_XRPL_ADDRESS,
					InvoiceID: transaction.hash
				} as Payment;

				console.log('<< xrp transaction');
				console.log(xrpTransaction);

				const payload = await xummSdk!.payload.create(xrpTransaction);

				console.log('<< payload ');
				console.log(payload);

				// update the transaction payload
				transactionBuilder.payload(payload!);
				transactionBuilder.payloadId(payload!.uuid);

				response.data = await transactionBuilder.update();
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return {
				...response,
				...{ data: response.data as HydratedDocument<HydratedTransactionProperties> }
			};
		})
});
