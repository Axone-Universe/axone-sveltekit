export interface UserNotificationProperties {
	url: string;
	senderName: string;
	receiverID: string;
	receiverName: string;
	receiverEmail: string;
	notification: string;
}

export interface TopicNotificationProperties {
	senderName: string;
	receiverID: string;
	receiverName: string;
	receiverEmail: string;
	notification: string;
}
