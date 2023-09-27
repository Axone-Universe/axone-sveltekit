import { trpc } from '$lib/trpc/client';
import { preprocessCampaigns } from '$lib/util/preprocess';
import type { HydratedDocument } from 'mongoose';
import type { LayoutServerLoad } from './$types';
import type { CampaignProperties } from '$lib/properties/campaign';

// const campaigns = [
// 	{
// 		title: 'Hogwarts Writing Spree',
// 		// Dates can maybe be in objects with start and end keys and maybe
// 		// other info if there are multiples dates with different meanings?
// 		organizer: { name: 'JK Rowling', link: '/' },
// 		dates: [new Date('2023-10-01'), new Date('2023-10-31')],
// 		about:
// 			"Unleash your imagination and join Hogwarts School of Witchcraft and Wizardry's thrilling creative writing campaign! Delve into the magical realms of storytelling, where pens and quills are your wands, and words have the power to transport readers to enchanting worlds.",
// 		tags: ['Harry Potter'],
// 		id: 'hogwarts-123',
// 		bannerURL: 'https://source.unsplash.com/tS-jh0M6JoA/400x175'
// 	},
// 	{
// 		title: 'Fantasy Central (First Edition)',
// 		organizer: { name: 'New York Times', link: '/' },
// 		dates: [new Date('2023-05-01'), new Date('2023-07-31')],
// 		about:
// 			'Embark on a quest of boundless imagination! Join our Fantasy Central Creative Writing Campaign and conjure worlds where magic reigns, mythical creatures roam, and heroes rise. Unleash your storytelling prowess and transport readers to realms of wonder and adventure. Let your words forge legends!',
// 		tags: ['Fantasy', 'Adventure'],
// 		id: 'fantasy-321',
// 		bannerURL: 'https://source.unsplash.com/JOzv_pAkcMk/400x175'
// 	},
// 	{
// 		title: 'For Science!',
// 		organizer: { name: 'NASA', link: '/' },
// 		dates: [new Date('2023-06-01'), new Date('2023-12-31')],
// 		about:
// 			"Ignite your cosmic creativity and join NASA's interstellar writing campaign! From the depths of space to the wonders of the universe, let your imagination soar as you craft celestial tales. Unveil the mysteries of the cosmos through the power of words and ignite a new era of storytelling.",
// 		tags: ['Sci-fi', 'Space'],
// 		id: 'scifi-321',
// 		bannerURL: 'https://source.unsplash.com/E0AHdsENmDg/400x175'
// 	}
// ];

export const load = (async (event) => {
	// get campaigns at layout to be stored in page.data to be used by all child pages
	const campaignResponses = (await trpc(
		event
	).campaigns.list.query()) as HydratedDocument<CampaignProperties>[];
	// const count = await trpc(event).campaigns.total.query();

	// Preprocess campaigns since Neo4j stores the object data as strings
	const campaigns = preprocessCampaigns(campaignResponses);

	return { campaigns };
}) satisfies LayoutServerLoad;
