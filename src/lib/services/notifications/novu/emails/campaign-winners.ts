import { render } from 'svelte-email';
import CampaignWinners from '$lib/components/notifications/email-templates/campaign-winners.svelte';
import type { UserProperties } from '$lib/properties/user';
import { Campaign } from '$lib/models/campaign';
import { User } from '$lib/models/user';
import type { HydratedDocument } from 'mongoose';
import type { CampaignProperties } from '$lib/properties/campaign';
import type { BookProperties } from '$lib/properties/book';
import { PUBLIC_DOMAIN_NAME } from '$env/static/public';
import { getAdminUser } from '../admin-user';

export interface CampaignWinnersEmailProps {
	campaignId: string;
}

export async function renderCampaignWinnersEmail({ campaignId }: CampaignWinnersEmailProps) {
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
	const campaignUrl = `${origin}/book/${book._id}`;

	// Fetch winners from the database if they exist
	let winners: HydratedDocument<UserProperties>[] = [];
	if (campaign.winners && Array.isArray(campaign.winners) && campaign.winners.length > 0) {
		// campaign.winners is an array of user ID strings
		const winnerIds = campaign.winners as string[];
		winners = await User.find({ _id: { $in: winnerIds } }).exec();
	}

	// Map winners with their positions
	const winnersWithPositions = winners.map((winner, index) => ({
		firstName: winner.firstName,
		lastName: winner.lastName,
		email: winner.email,
		position: index + 1
	}));

	return render({
		template: CampaignWinners,
		props: {
			campaignTitle: book.title,
			winners: winnersWithPositions.map((winner) => ({
				firstName: winner.firstName ?? '',
				lastName: winner.lastName ?? '',
				email: winner.email ?? '',
				position: winner.position
			})),
			campaignUrl,
			origin
		}
	});
}
