import { Novu } from '@novu/node';
import { NOVU_API_KEY } from '$env/static/private';
import type { UserProperties } from '$lib/properties/user';

const novu = new Novu(NOVU_API_KEY);

/**
 * Sends a collaboration notification to the userID
 * @param userID
 * @param firstName
 * @param documentName
 * @param message
 */
export async function sendCollaborationNotification(
	sender: UserProperties,
	receiver: UserProperties,
	documentName: string,
	message: string
) {
	// first create the subscriber / the person receiving the notification
	await novu.subscribers.identify(receiver._id, {
		firstName: receiver.firstName,
		email: receiver.email
	});

	// send the notification
	await novu.trigger('collaboration', {
		to: {
			subscriberId: receiver._id,
			email: receiver.email
		},
		payload: {
			firstName: sender.firstName,
			documentName: documentName,
			message: message
		}
	});
}
