import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/shared/book';
import type { StorylineProperties } from '$lib/shared/storyline';
import type { ChapterProperties } from '$lib/shared/chapter';

export const ssr = false;

export const load = (async (event) => {
	const bookID = event.params.bookID;
	const storylineID = event.url.searchParams.get('storylineID');

	const userAuthoredBookResponse = (await trpc(event).books.getById.query({
		searchTerm: bookID,
		limit: 10
	})) as HydratedDocument<BookProperties>;

	const storylineResponse = (await trpc(event).storylines.getById.query({
		bookID: bookID,
		storylineID: storylineID ? storylineID : undefined
	})) as HydratedDocument<StorylineProperties>;

	const storylineChapters = (await trpc(event).chapters.getAll.query({
		storylineID: storylineResponse._id
	})) as HydratedDocument<ChapterProperties>[];

	const chapterResponses: { [key: string]: HydratedDocument<ChapterProperties> } = {};
	storylineChapters.forEach((chapterResponse) => {
		chapterResponses[chapterResponse._id] = chapterResponse;
	});

	console.log('*** ed se');
	console.log(storylineResponse);
	return { userAuthoredBookResponse, storylineResponse, chapterResponses };
}) satisfies PageServerLoad;
