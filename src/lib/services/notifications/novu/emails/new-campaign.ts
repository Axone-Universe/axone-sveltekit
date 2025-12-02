import { render } from 'svelte-email';
import NewCampaign from '$lib/components/notifications/email-templates/new-campaign.svelte';
import { formattedDate } from '$lib/util/studio/strings';
import { Campaign } from '$lib/models/campaign';
import type { HydratedDocument } from 'mongoose';
import type { CampaignProperties } from '$lib/properties/campaign';
import type { BookProperties } from '$lib/properties/book';
import { PUBLIC_DOMAIN_NAME } from '$env/static/public';
import { getAdminUser } from '../admin-user';

export interface NewCampaignEmailProps {
	campaignId: string;
}

export async function renderNewCampaignEmail({ campaignId }: NewCampaignEmailProps) {
	// Get admin user for aggregate query options (ensures correct permissions)
	const adminUser = await getAdminUser();

	// Fetch the campaign from the database (book is automatically populated)
	const campaigns = await Campaign.aggregate(
		[
			{
				$match: { _id: campaignId }
			}
		],
		{
			user: adminUser
		}
	).exec();

	if (!campaigns || campaigns.length === 0) {
		throw new Error(`Campaign with ID ${campaignId} not found`);
	}

	const campaign = campaigns[0] as HydratedDocument<CampaignProperties> & {
		book: HydratedDocument<BookProperties>;
	};

	if (!campaign.book) {
		throw new Error(`Book not found for campaign ${campaignId}`);
	}

	const book = campaign.book as HydratedDocument<BookProperties>;
	const origin = PUBLIC_DOMAIN_NAME;

	const startDate = campaign.startDate
		? formattedDate(new Date(campaign.startDate))
		: 'Not specified';
	const endDate = campaign.endDate ? formattedDate(new Date(campaign.endDate)) : 'Not specified';
	const campaignUrl = `${origin}/book/${book._id}`;

	const html = render({
		template: NewCampaign,
		props: {
			campaignTitle: book.title,
			campaignDescription: book.description,
			startDate,
			endDate,
			criteria: campaign.criteria || [],
			rewards: campaign.rewards || [],
			resources: campaign.resources || [],
			campaignUrl,
			origin
		}
	});

	return html;
}
