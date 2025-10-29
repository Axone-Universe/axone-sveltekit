import { TransactionBuilder } from '$lib/documents/transaction';
import type { TransactionProperties } from '$lib/properties/transaction';
import { TransactionsRepository } from '$lib/repositories/transactionsRepository';
import { UsersRepository } from '$lib/repositories/usersRepository';
import { AccountsRepository } from '$lib/repositories/accountsRepository';
import { AccountBuilder } from '$lib/documents/account';
import { logger } from '$lib/trpc/middleware/logger';
import { auth } from '$lib/trpc/middleware/auth';
import { t } from '$lib/trpc/t';
import type { Response, CurrencyCode } from '$lib/util/types';
import mongoose, { type HydratedDocument } from 'mongoose';
import { z } from 'zod';
import { read, redeemReward } from '../schemas/transactions';
import { AXONE_ADMIN_EMAIL } from '$env/static/private';

export const transactions = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const transactionsRepo = new TransactionsRepository();

			const response: Response = {
				success: true,
				message: 'transactions successfully obtained',
				data: {}
			};

			try {
				const result = await transactionsRepo.get(ctx, input);

				response.data = result;
				response.cursor = result.length > 0 ? (input.cursor ?? 0) + result.length : undefined;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return {
				...response,
				...{ data: response.data as HydratedDocument<TransactionProperties>[] }
			};
		}),
	getByPayloadId: t.procedure
		.input(z.object({ payloadId: z.string().optional() }))
		.query(async ({ input }) => {
			const response: Response = {
				success: true,
				message: 'transaction successfully obtained',
				data: {}
			};

			const transactionsRepo = new TransactionsRepository();

			// get the transaction
			const transaction = await transactionsRepo.getByPayloadId(input.payloadId!);
			response.data = transaction;

			return {
				...response,
				...{ data: response.data as HydratedDocument<TransactionProperties> }
			};
		}),
	cancel: t.procedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const response: Response = {
			success: true,
			message: 'transaction successfully cancelled',
			data: {}
		};

		const transactionBuilder = new TransactionBuilder(input.id);
		try {
			const result = await transactionBuilder.delete();
			response.data = result;
		} catch (error) {
			response.success = false;
			response.message = error instanceof Object ? error.toString() : 'unkown error';
		}

		return { ...response, ...{ data: response.data as mongoose.mongo.DeleteResult } };
	}),
	redeemReward: t.procedure
		.use(logger)
		.use(auth)
		.input(redeemReward)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'reward redeemed successfully',
				data: {}
			};

			console.log('<< redeemReward');
			console.log(input);

			try {
				// Get referral count to verify points
				const usersRepo = new UsersRepository();
				const referralCount = await usersRepo.countReferrals(ctx.session!.user.id);
				const totalEarnedPoints = referralCount * 10;

				// Get all redemption transactions to calculate used points
				const transactionsRepo = new TransactionsRepository();
				const redemptionTransactions = await transactionsRepo.getRedemptionTransactions(
					ctx.session!.user.id
				);
				// Extract points from documentId field (where we stored the points)
				const usedPoints = redemptionTransactions.reduce((sum, txn) => {
					const points = parseInt(txn.documentId ?? '0', 10);
					return sum + points;
				}, 0);

				const availablePoints = totalEarnedPoints - usedPoints;

				// Check if user has enough points
				if (availablePoints < input.points) {
					response.success = false;
					response.message = 'Insufficient points';
					return response;
				}

				// Get the axone admin user
				const admin = await usersRepo.getByEmail(ctx, AXONE_ADMIN_EMAIL);
				if (!admin) {
					throw new Error('Admin user not found');
				}

				// Get or create account in USD currency (for Rand vouchers)
				const accountsRepo = new AccountsRepository();
				let account = await accountsRepo.getByUserId(ctx.session!.user.id, false);

				// If account doesn't exist or is not in USD, create a USD account
				if (!account || account.currency !== 'USD') {
					const accountBuilder = new AccountBuilder(undefined, 'USD').userID(ctx.session!.user.id);
					account = await accountBuilder.build();
				}

				// The voucher value is the monetary value in Rand (which we'll store as USD cents)
				// For simplicity, we'll treat R1 = $1 for the account balance
				const voucherValue = input.rewardValue; // in Rand/USD
				const voucherValueCents = voucherValue * 100; // Convert to cents

				// 1. Create Redemption transaction (increases balance by monetary value, status: success)
				// Note: We store the monetary value in value/netValue (for balance updates)
				// and the points in documentId (for tracking used points)
				const redemptionTransaction = await new TransactionBuilder()
					.type('Redemption')
					.senderID(admin._id) // Admin is the sender
					.receiverID(ctx.session!.user.id) // User is the receiver
					.accountId(account._id)
					.accountCurrency(account.currency as CurrencyCode)
					.exchangeRate(1) // 1:1 for USD
					.currency('USD')
					.value(voucherValueCents) // Store monetary value in cents (for balance)
					.netValue(voucherValueCents)
					.documentId(input.points.toString()) // Store points for tracking
					.note(
						`Redemption: ${input.rewardType} - R${input.rewardValue} voucher (${input.points} points redeemed)`
					)
					.status('success') // Mark as success to increase balance
					.sessionUser(ctx.user!)
					.build();

				console.log('<< redemptionTransaction created');
				console.log(redemptionTransaction);

				// 2. Create Withdrawal transaction (tracks monetary value, pending until processed by admin)
				const withdrawalTransaction = await new TransactionBuilder()
					.type('Withdrawal')
					.senderID(admin._id) // Admin is the sender
					.receiverID(ctx.session!.user.id) // User is the receiver
					.accountId(account._id)
					.accountCurrency(account.currency as CurrencyCode)
					.exchangeRate(1) // 1:1 for USD
					.currency('USD')
					.value(voucherValueCents) // Store monetary value in cents
					.netValue(voucherValueCents)
					.note(`Withdrawal: ${input.rewardType} - R${input.rewardValue} voucher pending delivery`)
					.status('pending') // Pending until admin processes
					.xrplType('Payment')
					.sessionUser(ctx.user!)
					.build();

				console.log('<< withdrawalTransaction created');
				console.log(withdrawalTransaction);

				response.data = {
					redemptionTransaction,
					withdrawalTransaction,
					account,
					message: `Reward of R${input.rewardValue} will be sent to your email within 24-48 hours`,
					pointsRedeemed: input.points,
					remainingPoints: availablePoints - input.points
				};
			} catch (error) {
				console.log('<< redeemReward error');
				console.log(error);
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unknown error';
			}

			return response;
		})
});
