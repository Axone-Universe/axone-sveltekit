import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { HydratedDocument } from 'mongoose';
import type { HydratedBookProperties } from '$lib/properties/book';
import { StorylinePropertyBuilder, type StorylineProperties } from '$lib/properties/storyline';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
	const bookData = (
		await trpc(event).books.getById.query({
			id: event.params.id,
			limit: 10
		})
	).data as HydratedDocument<HydratedBookProperties>;

	// If there are no viewing permissions redirect
	if (!bookData.userPermissions?.view) {
		throw redirect(303, '/permissions/' + bookData._id + '/?documentType=book');
	}

	const storylineResponses = (
		await trpc(event).storylines.getByIds.query({
			ids: bookData.storylines as string[]
		})
	).data as HydratedDocument<StorylineProperties>[];

	const storylines: { [key: string]: HydratedDocument<StorylineProperties> } = {};

	const storylinePropertyBuilder = new StorylinePropertyBuilder();
	let activeStoryline =
		storylinePropertyBuilder.getProperties() as HydratedDocument<StorylineProperties>;

	if (storylineResponses.length > 0) {
		activeStoryline = storylineResponses[0];
	}

	const storylineID = event.url.searchParams.get('storylineID');
	storylineResponses.forEach((storylineResponse) => {
		if (storylineResponse.main) {
			activeStoryline = storylineResponse;
		}
		storylines[storylineResponse._id] = storylineResponse;
	});

	if (storylineID && storylines[storylineID]) activeStoryline = storylines[storylineID];

	return { bookData, storylines, activeStoryline };
}) satisfies PageServerLoad;
