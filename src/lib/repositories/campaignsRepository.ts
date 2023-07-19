import type { CampaignProperties } from '$lib/shared/campaign';
import { Repository } from '$lib/repositories/repository';
import type { HydratedDocument } from 'mongoose';
import { Campaign } from '$lib/models/campaign';

export class CampaignsRepository extends Repository {
	async get(
		title?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<CampaignProperties>[]> {
		let query = Campaign.find(title ? { title: title } : {});

		if (skip) {
			query = query.skip(skip);
		}

		if (limit) {
			query = query.limit(limit);
		}

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

	getById(
		searchTerm?: string | undefined,
		limit?: number | undefined,
		skip?: number | undefined
	): Promise<unknown> {
		throw new Error('Method not implemented.');
	}

	getByTitle(
		searchTerm?: string | undefined,
		limit?: number | undefined,
		skip?: number | undefined
	): Promise<unknown[]> {
		throw new Error('Method not implemented.');
	}
}
