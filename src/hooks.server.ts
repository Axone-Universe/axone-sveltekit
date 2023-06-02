import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import { redirect, type Handle } from '@sveltejs/kit';
import { createTRPCHandle } from 'trpc-sveltekit';

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { sequence } from '@sveltejs/kit/hooks';

const supabaseHandle: Handle = async ({ event, resolve }) => {
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
		} else if (event.url.pathname !== '/') {
			throw redirect(303, '/');
		}
	} else {
		if (
			!session.user.user_metadata.profile &&
			event.url.pathname.startsWith('/profile') &&
			event.url.pathname !== '/profile/create'
		) {
			throw redirect(303, '/profile/create');
		} else if (session.user.user_metadata.profile && event.url.pathname === '/profile/create') {
			// user already has a profile - go to it instead of creating one
			throw redirect(303, `/profile/${session.user.id}`);
		} else if (event.url.pathname === '/login' || event.url.pathname === '/sign-up') {
			// user already logged in - redirect to home page
			throw redirect(303, '/');
		}
	}

	// User if the user is logged in and coming from the landing page, go to the homepage
	if (event.url.pathname === '/') {
		const session = await event.locals.getSession();
		if (session) {
			throw redirect(303, '/home');
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
