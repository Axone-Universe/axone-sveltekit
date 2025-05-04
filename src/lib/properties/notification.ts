import { type NotificationType } from '$lib/util/types';

export interface UserNotificationProperties {
	url: string;
	type: NotificationType;
	subject: string;
	senderID: string;
	receiverID: string;
	notification: string;
}

export interface TopicNotificationProperties {
	url: string;
	type: NotificationType;
	subject: string;
	topicKey: string;
	topicName: string;
	notification: string;
}
