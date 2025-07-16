import { TransactionBuilder } from '$lib/documents/transaction';
import { TransactionProperties } from '$lib/properties/transaction';
import { TransactionsRepository } from '$lib/repositories/transactionsRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import type { Response } from '$lib/util/types';
import mongoose, { HydratedDocument } from 'mongoose';
import { XummWebhookBody } from 'xumm-sdk/dist/src/types';
import { z } from 'zod';
import { read } from '../schemas/transactions';

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
				const result = await transactionsRepo.get(ctx.session, input);

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
	xaman: t.procedure.input(z.any()).mutation(async ({ input }) => {
		const response: Response = {
			success: true,
			message: 'webhook data successfully received',
			data: {}
		};

		const transactionsRepo = new TransactionsRepository();

		const webhookBody: XummWebhookBody = input as XummWebhookBody;
		const payloadResponse = webhookBody.payloadResponse;

		// get the transaction
		const transaction = await transactionsRepo.getByPayloadId(payloadResponse.payload_uuidv4);

		// update the transaction
		const transactionBuilder = new TransactionBuilder(transaction._id);
		transactionBuilder.externalId(payloadResponse.txid);
		if (payloadResponse.signed) {
			transactionBuilder.status('success');
			transactionBuilder.processedAt(new Date());
		}

		const updatedTransaction = await transactionBuilder.update();

		console.log('<< transaction');
		console.log(updatedTransaction);

		return response;
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

			console.log('<< response');
			console.log(response);
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
	})
});
