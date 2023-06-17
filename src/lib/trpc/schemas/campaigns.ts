import { z } from 'zod';

import type { CreateCampaign } from '$lib/util/types';

export const create = z.object({
	title: z.string(),
	organizer: z.object({ name: z.string(), link: z.string() }),
	dates: z.array(
		z.object({ startDate: z.coerce.date(), endDate: z.coerce.date(), event: z.string() })
	),
	about: z.string(),
	tags: z.array(z.string()),
	bannerURL: z.string(),
	submissionCriteria: z.string(),
	rewards: z.string(),
	previewText: z.string()
}) satisfies z.ZodType<CreateCampaign>;
