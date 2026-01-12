import { novu } from '$lib/util/notifications/novu';

export interface TriggerTransactionProcessedWorkflowParams {
	transactionId: string;
	receiverId: string;
}

/**
 * Triggers the transaction processed workflow
 * This function sends a notification to the receiver of the transaction
 * when a transaction has been successfully processed
 */
export async function triggerTransactionProcessedWorkflow({
	transactionId,
	receiverId
}: TriggerTransactionProcessedWorkflowParams) {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	try {
		await novu.trigger('transaction-processed', {
			to: [
				{
					subscriberId: receiverId
				}
			],
			payload: {
				transactionId
			}
		});
	} catch (e: unknown) {
		console.log('novu - trigger transaction processed workflow error');
		console.log(e);
		throw e;
	}
}

