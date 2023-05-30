import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { trpc } from '$lib/trpc/client';
import type { UserResponse } from '$lib/nodes/user';
import type { CreateUser, FictionalGenres, NonFictionalGenres } from '$lib/util/types';

export const load = (async (event) => {
	const session = await event.locals.getSession();

	if (session && session.user.id) {
		// check if user has a profile
		const userResponse = (await trpc(event).users.list.query({
			searchTerm: session.user.id
		})) as UserResponse[];
		if (userResponse.length === 1) {
			const userNode = userResponse[0].user;
			const fictional: FictionalGenres = {
				'Action & Adventure': false,
				Dystopian: false,
				Fantasy: false,
				Historical: false,
				Horror: false,
				Mystery: false,
				Romance: false,
				'Science Fiction': false,
				Thriller: false,
				'Young Adult': false
			};
			const nonFictional: NonFictionalGenres = {
				Autobiographies: false,
				Biographies: false,
				Historical: false,
				Journalism: false,
				'Self-help': false,
				Science: false,
				'Travel Guides': false
			};
			if (userNode.properties.fictional) {
				userNode.properties.fictional.forEach((genre) => (fictional[genre] = true));
			}

			if (userNode.properties.nonFictional) {
				userNode.properties.nonFictional.forEach((genre) => (nonFictional[genre] = true));
			}
			const user: CreateUser = {
				firstName: userNode.properties.firstName ?? '',
				lastName: userNode.properties.lastName ?? '',
				about: userNode.properties.about ?? '',
				userWriterChecked: userNode.labels.indexOf('Writer') !== -1 ? true : false,
				userEditorChecked: userNode.labels.indexOf('Editor') !== -1 ? true : false,
				userIllustratorChecked: userNode.labels.indexOf('Illustrator') !== -1 ? true : false,
				facebook: userNode.properties.facebook ?? '',
				instagram: userNode.properties.instagram ?? '',
				twitter: userNode.properties.twitter ?? '',
				fictional,
				nonFictional
			};
			return { user };
		} else {
			if (session.user.user_metadata.profile) {
				await event.locals.supabase.auth.updateUser({ data: { profile: false } });
			}
			throw redirect(303, '/profile/create');
		}
	} else {
		throw redirect(303, '/login');
	}
}) satisfies PageServerLoad;
