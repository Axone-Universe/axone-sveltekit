import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import type { StorylineProperties } from '$lib/properties/storyline';
import type { ChapterProperties } from '$lib/properties/chapter';
import { error } from '@sveltejs/kit';

export const ssr = false;

export const load = (async (event) => {
	const documentID = event.params.documentID;
	const documentType = event.url.searchParams.get('documentType');

	let document!:
		| HydratedDocument<BookProperties>
		| HydratedDocument<ChapterProperties>
		| HydratedDocument<StorylineProperties>;

	switch (documentType) {
		case 'book': {
			document = (await trpc(event).books.getById.query({
				id: documentID
			})) as HydratedDocument<BookProperties>;
			break;
		}
		case 'storyline': {
			document = (await trpc(event).storylines.getById.query({
				id: documentID
			})) as HydratedDocument<StorylineProperties>;
			break;
		}
		case 'chapter': {
			document = (await trpc(event).chapters.getById.query({
				id: documentID
			})) as HydratedDocument<ChapterProperties>;
			break;
		}
		default: {
			break;
		}
	}

	if (!document) {
		throw error(404, {
			message: 'Not found'
		});
	}

	return { document };
}) satisfies PageServerLoad;
