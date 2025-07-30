import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import type { Response } from '$lib/util/types';
import { AXONE_ADMIN_EMAIL, AXONE_XRPL_ADDRESS } from '$env/static/private';
import { PUBLIC_PLATFORM_FEES, PUBLIC_DOMAIN_NAME } from '$env/static/public';
import {
	NFTokenMint,
	type Payment,
	xrpToDrops,
	convertStringToHex,
	NFTokenMintFlagsInterface,
	NFTokenMintFlags
} from 'xrpl';
import { xummSdk } from '$lib/services/xumm';

import { RatesResponse, XummWebhookBody } from 'xumm-sdk/dist/src/types';
import { createPayload, readRates } from '../schemas/xumm';
import { AccountsRepository } from '$lib/repositories/accountsRepository';
import { TransactionBuilder } from '$lib/documents/transaction';
import { HydratedTransactionProperties } from '$lib/properties/transaction';
import { HydratedDocument } from 'mongoose';
import { auth } from '../middleware/auth';
import { currencies } from '$lib/util/constants';
import { z } from 'zod';
import { TransactionsRepository } from '$lib/repositories/transactionsRepository';
import { ResourcesRepository } from '$lib/repositories/resourcesRepository';
import { resourceCollectionsData } from '$lib/properties/resource';
import { UsersRepository } from '$lib/repositories/usersRepository';
import { ResourceBuilder } from '$lib/documents/digital-assets/resource';

export const xumm = t.router({
	createToken: t.procedure
		.use(logger)
		.use(auth)
		.input(z.object({ resourceId: z.string() }))
		.query(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'token successfully submitted for tokenizing!',
				data: {}
			};

			// get resource to be tokenized
			const resourcesRepo = new ResourcesRepository();
			const resource = await resourcesRepo.getById(ctx.session, input.resourceId);

			// get account of minter
			const accountRepo = new AccountsRepository();
			const account = await accountRepo.getByUserId(resource.user!._id, true);

			// get the axone admin user
			const usersRepo = new UsersRepository();
			const admin = await usersRepo.getByEmail(ctx.session, AXONE_ADMIN_EMAIL);

			// create the transaction
			const transactionBuilder = new TransactionBuilder()
				.accountId(account._id)
				.receiverID(resource.user!._id)
				.senderID(admin!._id)
				.exchangeRate(1)
				.accountCurrency(account.currency!)
				.resource(resource._id)
				// It's XRP because we are using the XUMM API
				.currency('XRP')
				.transferFee(resource.royalties ?? 0)
				.netValue(0)
				.documentId(resource.chapter!._id)
				.documentType('Chapter')
				.note('Token Minting')
				.type('NFTokenMint')
				.xrplType('NFTokenMint');

			const transaction = await transactionBuilder.build();

			console.log('<< txn created');
			console.log(transaction);

			const nftUri = PUBLIC_DOMAIN_NAME + 'tokens/' + resource._id;
			const nftID = convertStringToHex(nftUri);

			console.log('<< nft uri');
			console.log(nftUri);

			try {
				const xrpTransaction = {
					TransactionType: transaction.xrplType,
					Account: AXONE_XRPL_ADDRESS,
					TransferFee: (transaction.fee ?? 0) * 1000,
					NFTokenTaxon: resourceCollectionsData[resource.nftCollection!].taxon,
					URI: nftID,
					Flags: NFTokenMintFlags.tfTransferable | NFTokenMintFlags.tfTrustLine
				} as NFTokenMint;

				console.log('<< xrp transaction');
				console.log(xrpTransaction);

				const payload = await xummSdk!.payload.create(xrpTransaction);

				console.log('<< payload ');
				console.log(payload);

				if (payload) {
					// update the transaction payload
					transactionBuilder.payload(payload!);
					transactionBuilder.payloadId(payload!.uuid);

					response.data = await transactionBuilder.update();
				} else {
					response.success = false;
					response.message = 'Error while creating NFT transaction payload';
				}
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
				console.log('!! token create error');
				console.log(error);
			}

			return {
				...response,
				...{ data: response.data as HydratedDocument<HydratedTransactionProperties> }
			};
		}),
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
	webhook: t.procedure.input(z.any()).mutation(async ({ input }) => {
		const response: Response = {
			success: true,
			message: 'webhook data successfully received',
			data: {}
		};

		const transactionsRepo = new TransactionsRepository();

		const webhookBody: XummWebhookBody = input as XummWebhookBody;
		const payloadResponse = webhookBody.payloadResponse;

		console.log('<< payload response');
		console.log(payloadResponse);

		// get the transaction
		const transaction = await transactionsRepo.getByPayloadId(payloadResponse.payload_uuidv4);

		// update the transaction
		const transactionBuilder = new TransactionBuilder(transaction._id);
		transactionBuilder.externalId(payloadResponse.txid);
		if (payloadResponse.signed) {
			transactionBuilder.status('success');
			transactionBuilder.processedAt(new Date());

			// update the resource
			if (transaction.xrplType === 'NFTokenMint') {
				const resourceBuilder = new ResourceBuilder(transaction.resource as string).isTokenized(
					true
				);
				await resourceBuilder.build();
			}
		}

		const updatedTransaction = await transactionBuilder.update();

		console.log('<< transaction');
		console.log(updatedTransaction);

		return response;
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

			console.log('<< create payload input');
			console.log(input);

			// get account of receiver or create one if not found
			const accountRepo = new AccountsRepository();
			const account = await accountRepo.getByUserId(input.receiver, true);

			// get the exchange rate
			const rates = await xummSdk!.getRates(account.currency!);
			const accountCurrencyToXrpExchangeRate = rates.XRP;

			// calculate the fees
			const currencyScale = currencies[input.currency].scale;
			const platformFee = (input.netValue * Number(PUBLIC_PLATFORM_FEES)).toFixed(currencyScale);

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
				.platformFee(Number(platformFee))
				.netValue(input.netValue)
				.documentId(input.documentId)
				.documentType(input.documentType)
				.note(input.note)
				.type(input.transactionType)
				.xrplType('Payment');

			console.log('<< txn created');
			console.log(transactionBuilder.properties);

			try {
				const xrpTransaction = {
					TransactionType: transactionBuilder.properties.xrplType,
					Amount: xrpToDrops(transactionBuilder.properties.value!),
					Destination: AXONE_XRPL_ADDRESS,
					InvoiceID: transactionBuilder.properties.hash
				} as Payment;

				console.log('<< xrp transaction');
				console.log(xrpTransaction);

				const payload = await xummSdk!.payload.create(xrpTransaction);

				console.log('<< payload ');
				console.log(payload);

				// update the transaction payload
				transactionBuilder.payload(payload!);
				transactionBuilder.payloadId(payload!.uuid);

				response.data = await transactionBuilder.build();
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
