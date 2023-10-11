import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import { redirect, type Handle } from '@sveltejs/kit';
import { createTRPCHandle } from 'trpc-sveltekit';

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { UsersRepository } from '$lib/repositories/usersRepository';
import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { sequence } from '@sveltejs/kit/hooks';
import { startMongo } from '$lib/db/mongo';
import type { UserProperties } from '$lib/properties/user';

const userRepo = new UsersRepository();

const supabaseHandle: Handle = async ({ event, resolve }) => {
	/**
	 * Create the DB connection
	 */
	startMongo();

	event.locals.supabase = createSupabaseServerClient({
		supabaseUrl: PUBLIC_SUPABASE_URL,
		supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
		event
	});

	/**
	 * a little helper that is written for convenience so that instead
	 * of calling `const { data: { session } } = await supabase.auth.getSession()`
	 * you just call this `await getSession()`
	 */

	event.locals.getSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session;
	};

	const session = await event.locals.getSession();

	if (!session) {
		if (event.url.pathname === '/profile/create' || event.url.pathname === '/profile/edit') {
			throw redirect(303, '/login');
		}
	} else {
		const user = await userRepo.getById(session, session.user.id);
		event.locals.user = user as UserProperties;

		// if the user is not created yet in the DB, create the user
		if (
			!user &&
			event.url.pathname !== '/profile/create' &&
			event.url.pathname !== '/trpc/users.create'
		) {
			throw redirect(303, '/profile/create');
		}

		// User if the user is logged in and coming from the landing page, go to the homepage
		if (event.url.pathname === '/') {
			throw redirect(303, '/home');
		}

		if (user && event.url.pathname === '/profile/create') {
			// user already has a profile - go to it instead of creating one
			throw redirect(303, `/profile/${session.user.id}`);
		}

		if (event.url.pathname === '/login' || event.url.pathname === '/sign-up') {
			// user already logged in - redirect to home page
			throw redirect(303, '/');
		}
	}

	return resolve(event, {
		/**
		 * There´s an issue with `filterSerializedResponseHeaders` not working when using `sequence`
		 *
		 * https://github.com/sveltejs/kit/issues/8061
		 */
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};

// NB: this order is important - do not change!
export const handle = sequence(supabaseHandle, createTRPCHandle({ router, createContext }));
