import type { AccountProperties } from '$lib/properties/account';
import { AccountsRepository } from '$lib/repositories/accountsRepository';
import { AXONE_ADMIN_EMAIL, AXONE_XRPL_ADDRESS } from '$env/static/private';
import { t } from '$lib/trpc/t';
import type { CurrencyCode, Response } from '$lib/util/types';
import { type HydratedDocument } from 'mongoose';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { TransactionBuilder } from '$lib/documents/transaction';
import { xummSdk } from '$lib/services/xumm';
import { type Payment, xrpToDrops } from 'xrpl';
import { UsersRepository } from '$lib/repositories/usersRepository';

export const accounts = t.router({
	get: t.procedure
		.use(auth)
		.input(z.object({ id: z.string() }))
		.query(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'account successfully obtained',
				data: {}
			};

			const accountsRepo = new AccountsRepository();

			// get the account
			const account = await accountsRepo.getById(ctx, input.id!);
			response.data = account;

			return {
				...response,
				...{ data: response.data as HydratedDocument<AccountProperties> }
			};
		}),
	getByUserId: t.procedure
		.use(auth)
		.input(z.object({ userId: z.string() }))
		.query(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'account successfully obtained',
				data: {}
			};

			const accountsRepo = new AccountsRepository();

			// get the account
			const account = await accountsRepo.getByUserId(input.userId!, true);
			response.data = account;

			return {
				...response,
				...{ data: response.data as HydratedDocument<AccountProperties> }
			};
		}),
	withdraw: t.procedure
		.use(auth)
		.input(
			z.object({
				id: z.string(),
				receiverAddress: z.string(),
				destinationTag: z.number().optional()
			})
		)
		.query(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'withdrawal successful!',
				data: {}
			};

			const accountsRepo = new AccountsRepository();

			// get the account
			const account = await accountsRepo.getById(ctx, input.id!);

			// get the exchange rate
			const rates = await xummSdk!.getRates(account.currency!);
			const exchangeRate = rates.XRP;

			// get the axone admin user
			const usersRepo = new UsersRepository();
			const admin = await usersRepo.getByEmail(ctx, AXONE_ADMIN_EMAIL);

			// create the transaction
			const transactionBuilder = new TransactionBuilder()
				.accountId(account._id)
				.senderID(admin!._id)
				.receiverID(ctx.session!.user.id)
				.accountCurrency(account.currency!)
				.exchangeRate(exchangeRate)
				.currency(account.currency as CurrencyCode)
				.value(account.balance!)
				.netValue(account.balance!)
				.note('Withdrawal')
				.type('Withdrawal')
				.xrplType('Payment');

			const transaction = await transactionBuilder.build();

			console.log('<< withdrawal txn');
			console.log(transaction);

			try {
				const xrpTransaction = {
					...{
						TransactionType: transaction.xrplType,
						Amount: xrpToDrops(transaction.value!),
						Destination: input.receiverAddress,
						InvoiceID: transaction.hash
					},
					...(input.destinationTag ? { DestinationTag: input.destinationTag } : {})
				} as Payment;

				console.log('<< xrp transaction');
				console.log(xrpTransaction);

				const payload = await xummSdk!.payload.create(xrpTransaction);

				console.log('<< payload ');
				console.log(payload);

				// update the transaction payload
				transactionBuilder.payload(payload!);
				transactionBuilder.payloadId(payload!.uuid);

				await transactionBuilder.update();
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			// get the updated account
			const updatedAccount = transactionBuilder.account;
			response.data = updatedAccount;

			return {
				...response,
				...{ data: response.data as HydratedDocument<AccountProperties> }
			};
		})
});
