import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from '$lib/shared/user';

export const load = (async (event) => {
	const session = await event.locals.getSession();

	if (session && session.user.id) {
		console.log('** get user dets');
		// check if user has a profile
		const userProperties = (await trpc(event).users.getById.query({
			searchTerm: session.user.id
		})) as HydratedDocument<UserProperties>;

		return { userProperties };
	} else {
		throw redirect(303, '/login');
	}
}) satisfies PageServerLoad;
