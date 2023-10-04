import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { getSession, user }, depends }) => {
	// TODO: not sure if this is "correct" but this forces our hooks to run on auth change
	// This is so we can redirect the user according to their auth status
	depends('supabase:auth');

	return {
		user: user ? JSON.parse(JSON.stringify(user)) : {},
		session: await getSession()
	};
};
