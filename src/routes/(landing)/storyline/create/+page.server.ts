import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import { error } from '@sveltejs/kit';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import type { StorylineProperties } from '$lib/properties/storyline';
import type { ChapterProperties } from '$lib/properties/chapter';

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

	const userAuthoredBookResponse = (
		await trpc(event).books.getById.query({
			id: bookID
		})
	).data as HydratedDocument<BookProperties>;

	const storylineResponse = (
		await trpc(event).storylines.getById.query({
			bookID: bookID,
			storylineID: parentStorylineID
		})
	).data as HydratedDocument<StorylineProperties>;

	const storylineChapters = (
		await trpc(event).chapters.getByStoryline.query({
			storylineID: storylineResponse._id,
			storylineChapterIDs: storylineResponse.chapters as string[],
			toChapterID: chapterID
		})
	).data as HydratedDocument<ChapterProperties>[];

	const chapterResponses: { [key: string]: HydratedDocument<ChapterProperties> } = {};
	storylineChapters.forEach((chapterResponse) => {
		chapterResponses[chapterResponse._id] = chapterResponse;
	});

	return { userAuthoredBookResponse, storylineResponse, chapterResponses };
}) satisfies PageServerLoad;
