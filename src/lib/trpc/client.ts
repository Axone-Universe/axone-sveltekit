import type { QueryClient } from '@tanstack/svelte-query';
import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit';
import { svelteQueryWrapper } from 'trpc-svelte-query-adapter';

import type { Router } from '$lib/trpc/router';

let browserClientWithQuery: ReturnType<typeof svelteQueryWrapper<Router>>;

export function trpcWithQuery(init?: TRPCClientInit, queryClient?: QueryClient) {
	const isBrowser = typeof window !== 'undefined';
	if (isBrowser && browserClientWithQuery) return browserClientWithQuery;
	const client = svelteQueryWrapper<Router>({
		client: createTRPCClient<Router>({ init }),
		queryClient
	});
	if (isBrowser) browserClientWithQuery = client;
	return client;
}

let browserClient: ReturnType<typeof createTRPCClient<Router>>;

export function trpc(init?: TRPCClientInit) {
	const isBrowser = typeof window !== 'undefined';
	if (isBrowser && browserClient) return browserClient;
	const client = createTRPCClient<Router>({ init });
	if (isBrowser) browserClient = client;
	return client;
}
