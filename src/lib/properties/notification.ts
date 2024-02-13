export interface UserNotificationProperties {
	url: string;
	senderName: string;
	receiverID: string;
	receiverName: string;
	receiverEmail: string;
	notification: string;
}

export interface TopicNotificationProperties {
	topicKey: string;
	topicName: string;
	url: string;
	notification: string;
}
