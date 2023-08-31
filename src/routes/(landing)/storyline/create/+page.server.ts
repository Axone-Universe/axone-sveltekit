import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import { error } from '@sveltejs/kit';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/shared/book';
import type { StorylineProperties } from '$lib/shared/storyline';
import type { ChapterProperties } from '$lib/shared/chapter';

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
	})) as HydratedDocument<BookProperties>;

	const storylineResponse = (await trpc(event).storylines.getById.query({
		bookID: bookID,
		storylineID: parentStorylineID
	})) as HydratedDocument<StorylineProperties>;

	const storylineChapters = (await trpc(event).chapters.getByStoryline.query({
		storylineChapterIDs: storylineResponse.chapters as string[],
		toChapterID: chapterID
	})) as HydratedDocument<ChapterProperties>[];

	const chapterResponses: { [key: string]: HydratedDocument<ChapterProperties> } = {};
	storylineChapters.forEach((chapterResponse) => {
		chapterResponses[chapterResponse._id] = chapterResponse;
	});

	return { userAuthoredBookResponse, storylineResponse, chapterResponses };
}) satisfies PageServerLoad;
