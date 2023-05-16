import type { RequestEvent } from '@sveltejs/kit';
import type { inferAsyncReturnType } from '@trpc/server';

export async function createContext({ locals: { getSession } }: RequestEvent) {
	const session = await getSession();

	return {
		session
	};
}

export type Context = inferAsyncReturnType<typeof createContext>;
