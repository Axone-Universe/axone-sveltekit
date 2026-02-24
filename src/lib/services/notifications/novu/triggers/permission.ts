import { novu } from '$lib/util/notifications/novu';
import type { PermissionedDocument } from '$lib/properties/permission';

export interface TriggerPermissionWorkflowParams {
	documentType: PermissionedDocument;
	documentId: string;
	senderId: string;
	receiverId: string;
}

/**
 * Triggers the collaboration request workflow for permission notifications
 * This function sends a notification to Novu which will process the workflow
 * The userId in the payload is the sender (person granting permission)
 * The notification is sent to the receiver (person receiving permission)
 */
export async function triggerPermissionWorkflow({
	documentType,
	documentId,
	senderId,
	receiverId
}: TriggerPermissionWorkflowParams) {
	console.log('** trigger permission workflow', process.env.NODE_ENV);

	if (process.env.NODE_ENV === 'test') {
		return;
	}

	try {
		await novu.trigger('collaboration-request', {
			to: [
				{
					subscriberId: receiverId
				}
			],
			payload: {
				userId: senderId,
				documentType,
				documentId
			}
		});
	} catch (e: unknown) {
		console.log('novu - trigger permission workflow error');
		console.log(e);
		throw e;
	}
}
