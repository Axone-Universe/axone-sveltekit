import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import type { StorylineProperties } from '$lib/properties/storyline';
import { redirect } from '@sveltejs/kit';

export const ssr = false;

export const load = (async (event) => {
	const bookID = event.params.bookID;
	const storylineID = event.url.searchParams.get('storylineID');

	const userAuthoredBookResponse = (
		await trpc(event).books.getById.query({
			id: bookID,
			limit: 10
		})
	).data as HydratedDocument<BookProperties>;

	// If there are no viewing permissions redirect
	if (!userAuthoredBookResponse.userPermissions?.view) {
		throw redirect(303, '/permissions/' + bookID + '/?documentType=book');
	}

	const storylineResponses = (
		await trpc(event).storylines.getByBookID.query({
			bookID: bookID
		})
	).data as HydratedDocument<StorylineProperties>[];

	const storylines: { [key: string]: HydratedDocument<StorylineProperties> } = {};
	let selectedStoryline: HydratedDocument<StorylineProperties> = storylineResponses[0];

	storylineResponses.forEach((storylineResponse) => {
		if (storylineResponse._id === storylineID) {
			selectedStoryline = storylineResponse;
		}
		storylines[storylineResponse._id] = storylineResponse;
	});

	return { userAuthoredBookResponse, storylines, selectedStoryline };
}) satisfies PageServerLoad;
