import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/shared/book';
import type { StorylineProperties } from '$lib/shared/storyline';
import type { ChapterProperties } from '$lib/shared/chapter';
import { book } from 'svelte-awesome/icons';

export const ssr = false;

export const load = (async (event) => {
	const bookID = event.params.bookID;
	const storylineID = event.url.searchParams.get('storylineID');

	const userAuthoredBookResponse = (await trpc(event).books.getById.query({
		searchTerm: bookID,
		limit: 10
	})) as HydratedDocument<BookProperties>;

	let storylineResponse: HydratedDocument<StorylineProperties>;

	if (storylineID) {
		storylineResponse = (await trpc(event).storylines.getById.query({
			storylineID: storylineID
		})) as HydratedDocument<StorylineProperties>;
	} else {
		storylineResponse = (
			await trpc(event).storylines.getByBookID.query({
				bookID: bookID,
				main: true
			})
		)[0] as HydratedDocument<StorylineProperties>;
	}

	const storylineChapters = (await trpc(event).chapters.getByStoryline.query({
		storylineChapterIDs: storylineResponse.chapters as string[]
	})) as HydratedDocument<ChapterProperties>[];

	const chapterResponses: { [key: string]: HydratedDocument<ChapterProperties> } = {};
	storylineChapters.forEach((chapterResponse) => {
		chapterResponses[chapterResponse._id] = chapterResponse;
	});

	console.log('** chp resp');
	console.log(chapterResponses);
	return { userAuthoredBookResponse, storylineResponse, chapterResponses };
}) satisfies PageServerLoad;
