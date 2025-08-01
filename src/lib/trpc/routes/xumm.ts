import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import type { Response } from '$lib/util/types';
import { AXONE_ADMIN_EMAIL, AXONE_XRPL_ADDRESS } from '$env/static/private';
import { PUBLIC_PLATFORM_FEES, PUBLIC_DOMAIN_NAME } from '$env/static/public';
import {
	NFTokenMint,
	NFTokenCreateOffer,
	type Payment,
	xrpToDrops,
	convertStringToHex,
	NFTokenMintFlags,
	NFTokenCreateOfferFlags,
	NFTokenAcceptOffer
} from 'xrpl';
import { xummSdk } from '$lib/services/xumm';

import { RatesResponse, XummWebhookBody } from 'xumm-sdk/dist/src/types';
import { buyToken, createPayload, readRates } from '../schemas/xumm';
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
import { getNFTokenId, getNFTokenOfferId, getNFTokenWalletAddress } from '$lib/services/xrpl';
import { sendUserNotifications } from '$lib/util/notifications/novu';

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
					Flags: NFTokenMintFlags.tfTransferable | NFTokenMintFlags.tfMutable
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
	listToken: t.procedure
		.use(logger)
		.use(auth)
		.input(z.object({ resourceId: z.string() }))
		.query(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'token successfully submitted for listing!',
				data: {}
			};

			// get resource to be listed
			const resourcesRepo = new ResourcesRepository();
			const resource = await resourcesRepo.getById(ctx.session, input.resourceId);

			if (!resource.isTokenized) {
				response.success = false;
				response.message = 'resource has not been tokenized';
				return response;
			}

			// get account of minter
			const accountRepo = new AccountsRepository();
			const account = await accountRepo.getByUserId(resource.user!._id, true);

			// get the axone admin user
			const usersRepo = new UsersRepository();
			const admin = await usersRepo.getByEmail(ctx.session, AXONE_ADMIN_EMAIL);

			// get the minting transaction
			const transactionsRepo = new TransactionsRepository();
			const NFTokenMintTxn = await transactionsRepo.getByResourceId(resource._id, 'NFTokenMint');

			// create the transaction
			const transactionBuilder = new TransactionBuilder()
				.accountId(account._id)
				.exchangeRate(1)
				.accountCurrency(account.currency!)
				.resource(resource._id)
				// It's XRP because we are using the XUMM API
				.currency('XRP')
				.transferFee(resource.royalties ?? 0)
				.netValue(0)
				.documentId(resource.chapter!._id)
				.documentType('Chapter')
				.note('Token Listing')
				.type('NFTokenCreateOffer')
				.xrplType('NFTokenCreateOffer');

			// if the owner is not admin, change receiver and sender
			if (resource.nftWalletAddress !== AXONE_XRPL_ADDRESS) {
				transactionBuilder.senderID(resource.user!._id);
			} else {
				transactionBuilder.receiverID(resource.user!._id).senderID(admin!._id);
			}

			const transaction = await transactionBuilder.build();

			console.log('<< txn created');
			console.log(transaction);

			const nftID = await getNFTokenId(resource, NFTokenMintTxn.externalId!);

			try {
				const xrpTransaction = {
					TransactionType: transaction.xrplType,
					Amount: xrpToDrops(resource.price!),
					NFTokenID: nftID,
					Flags: NFTokenCreateOfferFlags.tfSellNFToken
				} as NFTokenCreateOffer;

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
					response.message = 'Error while creating NFT offer transaction payload';
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
	buyToken: t.procedure
		.use(logger)
		.use(auth)
		.input(buyToken)
		.query(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'token successfully submitted for buying!',
				data: {}
			};

			// get resource to be bought
			const resourcesRepo = new ResourcesRepository();
			const resource = await resourcesRepo.getById(ctx.session, input.resourceId);

			if (!resource.isListed) {
				response.success = false;
				response.message = 'resource has not been listed';
				return response;
			}

			// get account of minter
			const accountRepo = new AccountsRepository();
			const account = await accountRepo.getByUserId(resource.user!._id, true);

			// get the offer transaction
			const transactionsRepo = new TransactionsRepository();
			const NFTokenMintTxn = await transactionsRepo.getByResourceId(resource._id, 'NFTokenMint');

			// get the exchange rate
			const rates = await xummSdk!.getRates(account.currency!);
			const accountCurrencyToXrpExchangeRate = rates.XRP;

			// calculate the fees and net value
			const currencyScale = currencies[account.currency!].scale;
			const platformFee = (resource.price! * Number(PUBLIC_PLATFORM_FEES)).toFixed(currencyScale);
			const netValue = (resource.price! - Number(platformFee)).toFixed(currencyScale);

			// get nftID
			const nftID = await getNFTokenId(resource, NFTokenMintTxn.externalId!);

			// get offer id
			const offerId = await getNFTokenOfferId(nftID!, xrpToDrops(resource.price!));

			// create the transaction
			const transactionBuilder = new TransactionBuilder()
				.accountId(account._id)
				.receiverID(resource.user!._id)
				.senderID(ctx.session!.user.id)
				.exchangeRate(accountCurrencyToXrpExchangeRate)
				.accountCurrency(account.currency!)
				.resource(resource._id)
				// It's XRP because we are using the XUMM API
				.currency('XRP')
				.platformFee(Number(platformFee))
				.netValue(Number(netValue))
				.documentId(resource.chapter!._id)
				.documentType('Chapter')
				.note('Token Buying')
				.type('NFTokenAcceptOffer')
				.xrplType('NFTokenAcceptOffer');

			const transaction = await transactionBuilder.build();

			console.log('<< txn created');
			console.log(transaction);

			try {
				const xrpTransaction = {
					TransactionType: transaction.xrplType,
					NFTokenSellOffer: offerId
				} as NFTokenAcceptOffer;

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

					if (input.notifications) {
						await sendUserNotifications(input.notifications);
					}
				} else {
					response.success = false;
					response.message = 'Error while creating NFT offer transaction payload';
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
		const resourceBuilder = new ResourceBuilder((transaction.resource ?? '') as string);

		if (payloadResponse.signed) {
			transactionBuilder.externalId(payloadResponse.txid);
			transactionBuilder.status('success');
			transactionBuilder.processedAt(new Date());

			// update the resource
			if (transaction.xrplType === 'NFTokenMint') {
				// get the nft id
				const nftID = await getNFTokenId(undefined, payloadResponse.txid!);

				resourceBuilder.isTokenized(true);
				resourceBuilder.nftWalletAddress(AXONE_XRPL_ADDRESS);
				if (nftID) resourceBuilder.nftId(nftID);
			}

			if (transaction.xrplType === 'NFTokenCreateOffer') {
				resourceBuilder.isListed(true);
			}

			if (transaction.xrplType === 'NFTokenAcceptOffer') {
				const resourcesRepo = new ResourcesRepository();
				const resource = await resourcesRepo.getById(null, (transaction.resource ?? '') as string);

				resourceBuilder.userID(transaction.receiver! as string).isListed(false);

				if (resource && resource.nftId) {
					const nftWalletAddress = await getNFTokenWalletAddress(payloadResponse.txid);
					resourceBuilder.nftWalletAddress(nftWalletAddress);
				}
			}
		}

		// updated resource and transaction
		await resourceBuilder.update();
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

				if (input.notifications) {
					await sendUserNotifications(input.notifications);
				}
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
