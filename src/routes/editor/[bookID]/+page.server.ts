import type { PageServerLoad } from './$types';
import type { UserAuthoredBookResponse } from '$lib/nodes/user';
import { trpc } from '$lib/trpc/client';
import type { StorylineResponse } from '$lib/nodes/digital-products/storyline';
import type { ChapterNode } from '$lib/nodes/digital-products/chapter';

export const ssr = false;

export const load = (async (event) => {
	const bookID = event.params.bookID;
	const storylineID = event.url.searchParams.get('storylineID');
	const chapterID = event.url.searchParams.get('chapterID');

	const userAuthoredBookResponse = (await trpc(event).books.getById.query({
		searchTerm: bookID,
		limit: 10
	})) as UserAuthoredBookResponse;

	const storylineResponse = (await trpc(event).storylines.getById.query({
		bookID: bookID,
		storylineID: storylineID ? storylineID : undefined
	})) as StorylineResponse;

	const storylineChapters = (await trpc(event).chapters.getAll.query({
		storylineID: storylineResponse.storyline.properties.id
	})) as ChapterNode[];

	const chapters: { [key: string]: ChapterNode } = {};
	storylineChapters.forEach((chapter) => {
		chapters[chapter.properties.id] = chapter;
	});

	return { userAuthoredBookResponse, storylineResponse, chapters };
}) satisfies PageServerLoad;
