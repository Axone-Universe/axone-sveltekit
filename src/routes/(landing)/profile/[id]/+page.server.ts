import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import { supabaseAdmin } from '$lib/util/supabase';
import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from '$lib/shared/user';

export const load = (async (event) => {
	const { data } = await supabaseAdmin.auth.admin.getUserById(event.params.id);

	if (data && data.user) {
		// check if user has a profile
		const userResponse = (await trpc(event).users.getById.query({
			searchTerm: event.params.id
		})) as HydratedDocument<UserProperties>;
		if (userResponse) {
			return { userResponse };
		}
	}

	throw error(404, 'The requested user profile does not exist');
}) satisfies PageServerLoad;
