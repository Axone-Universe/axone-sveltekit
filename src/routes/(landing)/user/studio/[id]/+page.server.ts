import { error, fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import { create } from '$lib/trpc/schemas/users';
import { supabaseAdmin } from '$lib/util/supabase';
import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from '$lib/shared/user';
import type { BookProperties } from '$lib/shared/book';


export const load = (async (event) => {
	const { data } = await supabaseAdmin.auth.admin.getUserById(event.params.id);
	const userID = event.params.id;

	const UserBooks = (await trpc(event).books.getBooksByUserID.query({
		searchTerm: userID
		
	})) as HydratedDocument<BookProperties>[];


	/*if (data && data.user) {
		// check if user has a profile
		const userResponse = (await trpc(event).users.list.query({
			searchTerm: event.params.id
		})) as HydratedDocument<UserProperties>[];
		if (userResponse.length === 1) {
			const userNode = userResponse[0];
			return { userNode };
		}
	}
*/
return {UserBooks };
	
}) satisfies PageServerLoad;

