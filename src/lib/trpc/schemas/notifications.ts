import { z } from 'zod';

export const userNotification = z.object({
	url: z.string(),
	subject: z.string(),
	senderID: z.string(),
	receiverID: z.string(),
	notification: z.string()
});

export const userNotifications = z.object({
	notifications: z.record(z.string(), userNotification)
});
