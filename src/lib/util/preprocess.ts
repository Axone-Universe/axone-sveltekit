import type { CampaignResponse } from '$lib/nodes/campaigns/campaign';
import type { CreateCampaign } from '$lib/util/types';

export function preprocessCampaigns(campaignResponses: CampaignResponse[]) {
	return campaignResponses.map((campaign) => {
		const organizer = JSON.parse(campaign.campaign.properties.organizer as string) as {
			name: string;
			link: string;
		};

		const dates = campaign.campaign.properties.dates?.map((date) => {
			const newDate = JSON.parse(date);
			newDate.startDate = new Date(newDate.startDate);
			newDate.endDate = new Date(newDate.endDate);
			return newDate;
		});

		return {
			...campaign.campaign.properties,
			organizer,
			dates
		} as CreateCampaign;
	});
}
