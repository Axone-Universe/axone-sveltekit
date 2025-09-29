import type { CampaignProperties } from '$lib/properties/campaign';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument, PipelineStage } from 'mongoose';
import { Campaign } from '$lib/models/campaign';
import type { Session } from '@supabase/supabase-js';
import type { ReadCampaign } from '$lib/trpc/schemas/campaigns';
import type { Context } from '$lib/trpc/context';

export class CampaignsRepository extends Repository {
	async get(ctx: Context, input: ReadCampaign): Promise<HydratedDocument<CampaignProperties>[]> {
		const pipeline: PipelineStage[] = [];
		const filter: any = {};

		if (input.id) {
			filter._id = input.id;
		}

		if (input.open) {
			const filterDate = new Date();
			filter.endDate = { $gt: filterDate };
		}

		pipeline.push({ $match: filter });

		if (input.cursor) {
			pipeline.push({ $skip: (input.cursor ?? 0) + (input.skip ?? 0) });
		}

		if (input.limit) pipeline.push({ $limit: input.limit });

		const query = Campaign.aggregate(pipeline, {
			user: ctx.user
		});

		return await query;
	}

	// Might not be necessary since the number of campaigns shouldn't be excessively high.
	// We can get the count from the length of the array that is returned from get() assuming
	// we always get all. But good to have this method just in case.
	async count(): Promise<number> {
		const count = await Campaign.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}

	getById(ctx: Context, id?: string): Promise<unknown> {
		throw new Error('Method not implemented.');
	}
}
