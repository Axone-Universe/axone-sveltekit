import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { listSchema, createCampaignSchema } from '$lib/trpc/schemas';
import { CampaignsRepository } from '$lib/repositories/campaignsRepository';
import { CampaignBuilder } from '$lib/nodes/campaigns/campaign';

const campaignsRepo = new CampaignsRepository();

export const campaigns = t.router({
	list: t.procedure
		.use(logger)
		.input(listSchema.optional())
		.query(async ({ input }) => {
			const result = await campaignsRepo.get(input?.searchTerm, input?.limit, input?.skip);

			return result;
		}),

	total: t.procedure.use(logger).query(async () => {
		const result = await campaignsRepo.count();

		return result;
	}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(createCampaignSchema)
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
