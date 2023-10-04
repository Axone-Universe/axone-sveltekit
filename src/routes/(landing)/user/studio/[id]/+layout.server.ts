import type { LayoutServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import type { StorylineProperties } from '$lib/properties/storyline';
import type { ChapterProperties } from '$lib/properties/chapter';

export const load: LayoutServerLoad = async (event) => {
	const userID = event.params.id;

	const UserBooks = (await trpc(event).books.getBooksByUserID.query({
		id: userID
	})) as HydratedDocument<BookProperties>[];

	const UserChapters = (await trpc(event).chapters.getChaptersByUserID.query({
		searchTerm: userID
	})) as HydratedDocument<ChapterProperties>[];

	const UserStorylines = (await trpc(event).storylines.getStorylinesByUserID.query({
		searchTerm: userID
	})) as HydratedDocument<StorylineProperties>[];

	return { UserBooks, UserChapters, UserStorylines };
};
