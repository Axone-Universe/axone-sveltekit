import { z } from 'zod';

const NotificationTypeSchema = z.enum(['USER', 'TOPIC']);

export const userNotification = z.object({
	url: z.string(),
	type: NotificationTypeSchema,
	subject: z.string(),
	senderID: z.string(),
	receiverID: z.string(),
	notification: z.string()
});

export const topicNotification = z.object({
	url: z.string(),
	type: NotificationTypeSchema,
	topicName: z.string(),
	topicKey: z.string(),
	subject: z.string(),
	notification: z.string()
});

export const userNotifications = z.object({
	notifications: z.record(z.string(), topicNotification)
});
