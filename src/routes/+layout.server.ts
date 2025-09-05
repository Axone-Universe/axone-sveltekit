import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { getSession, user }, url, depends }) => {
	// TODO: not sure if this is "correct" but this forces our hooks to run on auth change
	// This is so we can redirect the user according to their auth status
	depends('supabase:auth');

	const session = await getSession();

	// redirect if no user profile has been created
	if (session && !user && url.pathname !== '/profile/create') {
		throw redirect(302, '/profile/create');
	}

	return {
		user: user ? JSON.parse(JSON.stringify(user)) : {},
		session: session
	};
};
