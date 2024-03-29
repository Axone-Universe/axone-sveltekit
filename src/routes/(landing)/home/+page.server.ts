import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
	const user = event.locals.user;

	// if the user is not created yet in the DB, create the user
	if (!user || user === null) {
		throw redirect(303, '/profile/create');
	}
}) satisfies PageServerLoad;
