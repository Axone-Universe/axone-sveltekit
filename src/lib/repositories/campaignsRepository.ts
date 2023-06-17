import { DBSession } from '$lib/db/session';
import type { CampaignResponse } from '$lib/nodes/campaigns/campaign';
import { Repository } from '$lib/repositories/repository';

export class CampaignsRepository extends Repository {
	async get(title?: string, limit?: number, skip?: number): Promise<CampaignResponse[]> {
		const query = `
			MATCH (campaign:Campaign)
			${title ? `WHERE campaign.title = '${title}'` : ''}
			RETURN campaign
			ORDER BY campaign.title
			${skip ? `SKIP ${skip}` : ''}
			${limit ? `LIMIT ${limit}` : ''}
		`;

		const session = new DBSession();
		const result = await session.executeRead<CampaignResponse>(query);

		const campaigns: CampaignResponse[] = [];
		result.records.forEach((record) => {
			campaigns.push(record.toObject());
		});

		return new Promise<CampaignResponse[]>((resolve) => {
			resolve(campaigns);
		});
	}

	// Might not be necessary since the number of campaigns shouldn't be excessively high.
	// We can get the count from the length of the array that is returned from get() assuming
	// we always get all. But good to have this method just in case.
	async count(): Promise<number> {
		const count = await this._count('Campaign');

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
