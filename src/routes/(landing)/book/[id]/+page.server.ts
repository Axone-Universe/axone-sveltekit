import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/shared/book';
import type { StorylineProperties } from '$lib/shared/storyline';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
	const bookData = (await trpc(event).books.getById.query({
		searchTerm: event.params.id,
		limit: 10
	})) as HydratedDocument<BookProperties>;

	// If there are no viewing permissions redirect
	if (!bookData.userPermissions?.view) {
		throw redirect(303, '/permissions/' + bookData._id + '/?documentType=book');
	}

	const storylineResponses = (await trpc(event).storylines.getByBookID.query({
		bookID: event.params.id
	})) as HydratedDocument<StorylineProperties>[];

	const storylines: { [key: string]: HydratedDocument<StorylineProperties> } = {};
	let activeStoryline: HydratedDocument<StorylineProperties> = storylineResponses[0];

	storylineResponses.forEach((storylineResponse) => {
		if (storylineResponse.main) {
			activeStoryline = storylineResponse;
		}
		storylines[storylineResponse._id] = storylineResponse;
	});

	return { bookData, storylines, activeStoryline };
}) satisfies PageServerLoad;
