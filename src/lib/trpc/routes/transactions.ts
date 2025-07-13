import { TransactionBuilder } from '$lib/documents/transaction';
import { TransactionProperties } from '$lib/properties/transaction';
import { TransactionsRepository } from '$lib/repositories/transactionsRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import type { Response } from '$lib/util/types';
import { HydratedDocument } from 'mongoose';
import { XummWebhookBody } from 'xumm-sdk/dist/src/types';
import { z } from 'zod';

export const transactions = t.router({
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
		})
});
