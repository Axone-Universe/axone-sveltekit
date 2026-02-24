import { novu } from '$lib/util/notifications/novu';

export interface TriggerNewCommentWorkflowParams {
	chapterId: string;
	commentId: string;
	recipientId: string;
}

/**
 * Triggers the new comment workflow
 * This function sends a notification to Novu which will process the workflow
 * The notification is sent to the recipient (typically the chapter owner)
 */
export async function triggerNewCommentWorkflow({
	chapterId,
	commentId,
	recipientId
}: TriggerNewCommentWorkflowParams) {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	try {
		await novu.trigger('new-comment', {
			to: [
				{
					subscriberId: recipientId
				}
			],
			payload: {
				chapterId,
				commentId
			}
		});
	} catch (e: unknown) {
		console.log('novu - trigger new comment workflow error');
		console.log(e);
		throw e;
	}
}

