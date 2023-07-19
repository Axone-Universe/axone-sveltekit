import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/shared/book';

export const load = (async (event) => {
	const userAuthoredBookResponses = (await trpc(event).books.getAll.query({
		limit: 10
	})) as HydratedDocument<BookProperties>[];

	return { userAuthoredBookResponses };
}) satisfies PageServerLoad;
