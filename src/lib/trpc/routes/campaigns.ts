import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, read, update } from '$lib/trpc/schemas/campaigns';
import { CampaignsRepository } from '$lib/repositories/campaignsRepository';
import { CampaignBuilder } from '$lib/documents/campaigns/campaign';
import { sendUserNotifications } from '$lib/util/notifications/novu';
import { BookBuilder } from '$lib/documents/digital-products/book';
import type { Response } from '$lib/util/types';
import type { HydratedDocument } from 'mongoose';
import type { CampaignProperties } from '$lib/properties/campaign';

const campaignsRepo = new CampaignsRepository();

export const campaigns = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input }) => {
			const response: Response = {
				success: true,
				message: 'campaigns successfully retrieved',
				data: {}
			};
			try {
				const result = await campaignsRepo.get(input);
				response.data = result;
				response.cursor = result.length > 0 ? result[result.length - 1]._id : undefined;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<CampaignProperties>[] } };
		}),

	total: t.procedure.use(logger).query(async () => {
		const response: Response = { success: true, message: 'total campaigns', data: {} };
		try {
			const result = await campaignsRepo.count();
			response.data = result;
		} catch (error) {
			response.success = false;
			response.message = error instanceof Object ? error.toString() : 'unkown error';
		}

		return { ...response, ...{ data: response.data as number } };
	}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ ctx, input }) => {
			const bookBuilder = new BookBuilder()
				.sessionUserID(ctx.session!.user.id)
				.userID(ctx.session!.user.id)
				.title(input.book.title)
				.description(input.book.description)
				.imageURL(input.book.imageURL);

			if (input.book.permissions) bookBuilder.permissions(input.book.permissions as any);
			if (input.book.genres) bookBuilder.genres(input.book.genres);

			const campaignBuilder = await new CampaignBuilder()
				.userID(ctx.session!.user.id)
				.startDate(input.startDate)
				.endDate(input.endDate)
				.submissionCriteria(input.submissionCriteria)
				.rewards(input.rewards)
				.book(bookBuilder.properties());

			const response: Response = {
				success: true,
				message: 'campaign successfully created',
				data: {}
			};

			try {
				const result = await campaignBuilder.build();

				if (input.book.notifications) {
					sendUserNotifications(input.book.notifications);
				}

				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<CampaignProperties> } };
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ ctx, input }) => {
			const bookBuilder = new BookBuilder(input.book.id)
				.sessionUserID(ctx.session!.user.id)
				.userID(ctx.session!.user.id);

			if (input.book.title) bookBuilder.title(input.book.title);
			if (input.book.description) bookBuilder.description(input.book.description);
			if (input.book.imageURL !== undefined) bookBuilder.imageURL(input.book.imageURL);
			if (input.book.genres) bookBuilder.genres(input.book.genres);
			if (input.book.permissions) bookBuilder.permissions(input.book.permissions as any);

			const campaignBuilder = new CampaignBuilder(input.id)
				.userID(ctx.session!.user.id)
				.book(bookBuilder.properties());

			if (input.startDate) campaignBuilder.startDate(input.startDate);
			if (input.endDate) campaignBuilder.endDate(input.endDate);
			if (input.submissionCriteria) campaignBuilder.submissionCriteria(input.submissionCriteria);
			if (input.rewards) campaignBuilder.rewards(input.rewards);

			const response: Response = {
				success: true,
				message: 'campaign successfully updated',
				data: {}
			};
			try {
				const result = await campaignBuilder.update();

				if (input.book.notifications) {
					sendUserNotifications(input.book.notifications);
				}
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<CampaignProperties> } };
		})
});
