import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals: { getSession, user }, depends }) => {
	// TODO: not sure if this is "correct" but this forces our hooks to run on auth change
	// This is so we can redirect the user according to their auth status
	depends('supabase:auth');

	// const session = await getSession();

	// if (!session) {
	// 	throw redirect(303, '/');
	// }

	return {
		user: user ? JSON.parse(JSON.stringify(user)) : {},
		session: await getSession()
	};
};
