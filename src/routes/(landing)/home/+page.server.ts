import type { PageServerLoad } from './$types';
import type { UserAuthoredBookResponse } from '$lib/nodes/user';
import { trpc } from '$lib/trpc/client';

export const load = (async (event) => {
	const userAuthoredBookResponses = (await trpc(event).books.list.query({
		limit: 10
	})) as UserAuthoredBookResponse[];

	return { userAuthoredBookResponses };
}) satisfies PageServerLoad;
