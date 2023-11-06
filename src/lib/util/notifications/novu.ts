/**
 * This file is used on the backend
 */
import { Novu } from '@novu/node';
import { NOVU_API_KEY } from '$env/static/private';
import type { UserNotificationProperties } from '$lib/properties/notification';

export const novu = new Novu(NOVU_API_KEY);

/**
 * Sends a collaboration notification to the userID
 * @param userID
 * @param firstName
 * @param notification
 */
export async function sendUserNotifications(notifications: {
	[key: string]: UserNotificationProperties;
}) {
	if (!notifications || Object.keys(notifications).length === 0) {
		return;
	}

	const subscriberPayloads = [];
	const notificationPayloads = [];

	for (const userID in notifications) {
		const notification = notifications[userID];

		const subscriberPayload = {
			subscriberId: notification.receiverID,
			firstName: notification.receiverName,
			email: notification.receiverEmail
		};
		subscriberPayloads.push(subscriberPayload);

		const notificationPayload = {
			name: 'user-notification',
			to: {
				subscriberId: notification.receiverID,
				email: notification.receiverEmail
			},
			payload: {
				firstName: notification.senderName,
				notification: notification.notification,
				url: notification.url
			}
		};
		notificationPayloads.push(notificationPayload);
	}

	// first create the subscriber / the person receiving the notification
	await novu.subscribers.bulkCreate(subscriberPayloads);
	// Then send the notifications
	const result = await novu.bulkTrigger(notificationPayloads);

	return result;
}