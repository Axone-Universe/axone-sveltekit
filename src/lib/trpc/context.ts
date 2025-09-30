import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext({ locals: { getSession, user } }: RequestEvent) {
	const session = await getSession();

	return {
		user,
		session
	};
}

export type Context = inferAsyncReturnType<typeof createContext>;
