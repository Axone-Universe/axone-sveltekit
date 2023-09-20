import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { create, read } from '$lib/trpc/schemas/campaigns';
import { CampaignsRepository } from '$lib/repositories/campaignsRepository';
import { CampaignBuilder } from '$lib/documents/campaigns/campaign';

const campaignsRepo = new CampaignsRepository();

export const campaigns = t.router({
	list: t.procedure
		.use(logger)
		.input(read.optional())
		.query(async ({ input }) => {
			const result = await campaignsRepo.get(input?.title, input?.limit, input?.cursor);

			return result;
		}),

	total: t.procedure.use(logger).query(async () => {
		const result = await campaignsRepo.count();

		return result;
	}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input }) => {
			const campaignResponse = await new CampaignBuilder()
				.title(input.title)
				.previewText(input.previewText)
				.dates(input.dates.map((date) => JSON.stringify(date)))
				.organizer(JSON.stringify(input.organizer))
				.tags(input.tags)
				.bannerURL(input.bannerURL)
				.about(input.about)
				.submissionCriteria(input.submissionCriteria)
				.rewards(input.rewards)
				.build();

			return campaignResponse;
		})
});
