import type { CampaignProperties } from '$lib/properties/campaign';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument } from 'mongoose';
import { Campaign } from '$lib/models/campaign';
import type { Session } from '@supabase/supabase-js';
import type { ReadCampaign } from '$lib/trpc/schemas/campaigns';

export class CampaignsRepository extends Repository {
	async get(readCampaign: ReadCampaign): Promise<HydratedDocument<CampaignProperties>[]> {
		const filter: any = {};

		if (readCampaign.id) {
			filter._id = readCampaign.id;
		}

		if (readCampaign.cursor) {
			filter._id = { $gt: readCampaign.cursor };
		}

		const query = Campaign.find(filter, null, { limit: readCampaign.limit });

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

	getById(session: Session | null, id?: string): Promise<unknown> {
		throw new Error('Method not implemented.');
	}
}
