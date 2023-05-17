import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { t } from '$lib/trpc/t';
import { users } from '$lib/trpc/routes/users';
import { books } from '$lib/trpc/routes/books';

export const router = t.router({
	books,
	users
});

export type Router = typeof router;

export type RouterInputs = inferRouterInputs<Router>;
export type RouterOutputs = inferRouterOutputs<Router>;
