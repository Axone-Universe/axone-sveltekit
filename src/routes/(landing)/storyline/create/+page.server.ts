import type { PageServerLoad } from './$types';
import type { UserAuthoredBookResponse } from '$lib/nodes/user';
import { trpc } from '$lib/trpc/client';
import type { StorylineResponse } from '$lib/nodes/digital-products/storyline';
import type { ChapterResponse } from '$lib/nodes/digital-products/chapter';
import { error } from '@sveltejs/kit';

export const ssr = false;

export const load = (async (event) => {
	const bookID = event.url.searchParams.get('bookID');
	const parentStorylineID = event.url.searchParams.get('parentStorylineID');
	const chapterID = event.url.searchParams.get('chapterID');

	if (!bookID || !parentStorylineID || !chapterID) {
		throw error(404, {
			message: 'Not found'
		});
	}

	const userAuthoredBookResponse = (await trpc(event).books.getById.query({
		searchTerm: bookID
	})) as UserAuthoredBookResponse;

	const storylineResponse = (await trpc(event).storylines.getById.query({
		bookID: bookID,
		storylineID: parentStorylineID
	})) as StorylineResponse;

	const storylineChapters = (await trpc(event).chapters.getAll.query({
		storylineID: storylineResponse.storyline.properties.id,
		toChapterID: chapterID
	})) as ChapterResponse[];

	const chapterResponses: { [key: string]: ChapterResponse } = {};
	storylineChapters.forEach((chapterResponse) => {
		chapterResponses[chapterResponse.chapter.properties.id] = chapterResponse;
	});

	return { userAuthoredBookResponse, storylineResponse, chapterResponses };
}) satisfies PageServerLoad;
