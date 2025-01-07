import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { userNotifications } from '$lib/trpc/schemas/notifications';
import { sendUserNotifications } from '$lib/util/notifications/novu';

export const notes = t.router({
	notifyUsers: t.procedure
		.use(logger)
		.use(auth)
		.input(userNotifications)
		.mutation(async ({ input, ctx }) => {
			const result = await sendUserNotifications(ctx.session, input.notifications);
			console.log(result);
		})
});
