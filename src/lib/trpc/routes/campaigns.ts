import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, read, update } from '$lib/trpc/schemas/campaigns';
import { CampaignsRepository } from '$lib/repositories/campaignsRepository';
import { CampaignBuilder } from '$lib/documents/campaigns/campaign';
import { sendUserNotifications } from '$lib/util/notifications/novu';
import { BookBuilder } from '$lib/documents/digital-products/book';

const campaignsRepo = new CampaignsRepository();

export const campaigns = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input }) => {
			const result = await campaignsRepo.get(input);

			return { result, cursor: result.length > 0 ? result[result.length - 1]._id : undefined };
		}),

	total: t.procedure.use(logger).query(async () => {
		const result = await campaignsRepo.count();

		return result;
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

			const campaignResponse = await new CampaignBuilder()
				.userID(ctx.session!.user.id)
				.startDate(input.startDate)
				.endDate(input.endDate)
				.submissionCriteria(input.submissionCriteria)
				.rewards(input.rewards)
				.book(bookBuilder.properties())
				.build();

			if (input.book.notifications) {
				sendUserNotifications(input.book.notifications);
			}

			return campaignResponse;
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

			const campaignBuilder = await new CampaignBuilder(input.id)
				.userID(ctx.session!.user.id)
				.book(bookBuilder.properties());

			if (input.startDate) campaignBuilder.startDate(input.startDate);
			if (input.endDate) campaignBuilder.endDate(input.endDate);
			if (input.submissionCriteria) campaignBuilder.submissionCriteria(input.submissionCriteria);
			if (input.rewards) campaignBuilder.rewards(input.rewards);

			const campaignResponse = campaignBuilder.update();

			if (input.book.notifications) {
				sendUserNotifications(input.book.notifications);
			}

			return campaignResponse;
		})
});
