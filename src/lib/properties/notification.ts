export interface UserNotificationProperties {
	subject: string;
	url: string;
	senderID: string;
	receiverID: string;
	notification: string;
}

export interface TopicNotificationProperties {
	topicKey: string;
	topicName: string;
	url: string;
	notification: string;
}
