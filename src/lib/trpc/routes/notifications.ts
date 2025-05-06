import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { userNotifications } from '$lib/trpc/schemas/notifications';
import { sendNotifications } from '$lib/util/notifications/novu';
import type { Response } from '$lib/util/types';

export const notifications = t.router({
	notifyUsers: t.procedure
		.use(logger)
		.use(auth)
		.input(userNotifications)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'notification successfully created',
				data: {}
			};
			const result = await sendNotifications(input.notifications);

			return response;
		})
});
