import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from '$lib/properties/user';

export const load = (async (event) => {
	// check if user has a profile
	const userResponse = await trpc(event).users.getById.query({
		id: event.params.id
	});

	const userData = userResponse.data as HydratedDocument<UserProperties>;

	if (userData) {
		return { userData };
	}

	throw error(404, 'The requested user profile does not exist');
}) satisfies PageServerLoad;
