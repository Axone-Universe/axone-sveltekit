import type { CampaignProperties } from '$lib/shared/campaign';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument } from 'mongoose';
import { Campaign } from '$lib/models/campaign';
import type { Session } from '@supabase/supabase-js';

export class CampaignsRepository extends Repository {
	async get(
		title?: string,
		limit?: number,
		cursor?: string
	): Promise<HydratedDocument<CampaignProperties>[]> {
		const filter: any = {};

		if (title) {
			filter.title = title;
		}

		if (cursor) {
			filter._id = { $gt: cursor };
		}

		const query = Campaign.find(filter, null, { limit });

		const campaigns = await query;

		return new Promise<HydratedDocument<CampaignProperties>[]>((resolve) => {
			resolve(campaigns);
		});
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

	getById(session: Session | null, id?: string): Promise<unknown> {
		throw new Error('Method not implemented.');
	}
}
