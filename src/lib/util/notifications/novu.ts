/**
 * This file is used on the backend
 */
import { Novu } from '@novu/node';
import { NOVU_API_KEY } from '$env/static/private';
import type {
	TopicNotificationProperties,
	UserNotificationProperties
} from '$lib/properties/notification';
import { HydratedDocument } from 'mongoose';
import { UserProperties } from '$lib/properties/user';
import { User } from '$lib/models/user';
import { Session } from '@supabase/supabase-js';

export const novu = new Novu(NOVU_API_KEY);

/**
 * Sends a collaboration notification to the userID
 * @param userID
 * @param firstName
 * @param notification
 */
export async function sendUserNotifications(
	session: Session | null,
	notifications: {
		[key: string]: UserNotificationProperties;
	}
) {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	if (!notifications || Object.keys(notifications).length === 0) {
		return;
	}

	const notificationPayloads = [];

	for (const userID in notifications) {
		const notification = notifications[userID];

		const users = await User.find({
			_id: { $in: [notification.receiverID, notification.senderID] }
		});

		const sender = users.find((user) => user.id === notification.senderID);
		const receiver = users.find((user) => user.id === notification.receiverID);

		if (sender && receiver) {
			const notificationPayload = {
				name: 'user-notification',
				to: {
					subscriberId: receiver.id,
					email: receiver.email
				},
				payload: {
					firstName: sender.firstName,
					notification: notification.notification,
					subject: notification.subject,
					url: notification.url
				}
			};
			notificationPayloads.push(notificationPayload);
		}
	}

	try {
		//send the notifications
		const result = await novu.bulkTrigger(notificationPayloads);
		return result;
	} catch (e: any) {
		console.log('novu send user notification error');
		console.log(e);
	}
}

export async function createNotificationSubscriber(user: HydratedDocument<UserProperties>) {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	const subscriberPayload = {
		subscriberId: user._id,
		firstName: user.firstName,
		lastName: user.lastName,
		avatar: user.imageURL,
		email: user.email
	};
	await novu.subscribers.bulkCreate([subscriberPayload]);

	// Add user to the general topic
	await subscribeToTopic('general', user._id);
}

/**
 * When a user adds a storyline to a reading list they will receive storyline notifications
 * @param documentID
 * @param userID
 * @returns
 */
export async function subscribeToTopic(topicKey: string, userID: string) {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	try {
		const response = await novu.topics.addSubscribers(topicKey, {
			subscribers: [userID]
		});
		return response;
	} catch (e: any) {
		console.log('novu - subscribe to topic error');
	}
}

export async function sendTopicNotification(notification: TopicNotificationProperties) {
	if (process.env.NODE_ENV === 'test') {
		return;
	}

	try {
		await novu.trigger('user-notification', {
			to: [{ type: 'Topic' as any, topicKey: notification.topicKey }],
			payload: {
				firstName: notification.topicName,
				notification: notification.notification,
				subject: notification.subject,
				url: notification.url
			}
		});
	} catch (e: any) {
		console.log('novu - send topic notification error');
	}
}
