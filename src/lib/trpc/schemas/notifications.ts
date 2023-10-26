import type { UserNotificationProperties } from '$lib/properties/notification';
import { z } from 'zod';

export const userNotification = z.object({
	url: z.string(),
	senderName: z.string(),
	receiverID: z.string(),
	receiverName: z.string(),
	receiverEmail: z.string(),
	notification: z.string()
}) satisfies z.ZodType<UserNotificationProperties>;

export const userNotifications = z.object({
	notifications: z.record(z.string(), userNotification)
});
