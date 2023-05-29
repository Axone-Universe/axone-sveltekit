import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { books } from '$lib/trpc/routes/books';
import { campaigns } from '$lib/trpc/routes/campaigns';
import { users } from '$lib/trpc/routes/users';
import { t } from '$lib/trpc/t';

export const router = t.router({
	books,
	campaigns,
	users
});

export type Router = typeof router;

export type RouterInputs = inferRouterInputs<Router>;
export type RouterOutputs = inferRouterOutputs<Router>;
