import type { PageServerLoad } from './$types';
import type { UserAuthoredBookResponse } from '$lib/nodes/user';
import { trpc } from '$lib/trpc/client';

export const load = (async (event) => {
	const userAuthoredBookResponse = (await trpc(event).books.getById.query({
		searchTerm: event.params.id,
		limit: 10
	})) as UserAuthoredBookResponse;

	return { userAuthoredBookResponse };
}) satisfies PageServerLoad;
