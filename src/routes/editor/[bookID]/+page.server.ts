import type { PageServerLoad } from './$types';
import type { UserAuthoredBookResponse } from '$lib/nodes/user';
import { trpc } from '$lib/trpc/client';
import type { StorylineResponse } from '$lib/nodes/digital-products/storyline';

export const ssr = false;

export const load = (async (event) => {
	const userAuthoredBookResponse = (await trpc(event).books.getById.query({
		searchTerm: event.params.bookID,
		limit: 10
	})) as UserAuthoredBookResponse;

	const storylineResponses = (await trpc(event).storylines.getAll.query({
		bookID: event.params.bookID
	})) as StorylineResponse[];

	const storylines: { [key: string]: StorylineResponse } = {};
	let activeStoryline: StorylineResponse = storylineResponses[0];

	storylineResponses.forEach((storylineResponse) => {
		if (storylineResponse.storyline.properties.main) {
			activeStoryline = storylineResponse;
		}
		storylines[storylineResponse.storyline.properties.id] = storylineResponse;
	});

	return { userAuthoredBookResponse, storylines, activeStoryline };
}) satisfies PageServerLoad;
