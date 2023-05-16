import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { t } from '$lib/trpc/t';
import { users } from '$lib/trpc/routes/users';

export const router = t.router({
	users
});

export type Router = typeof router;

export type RouterInputs = inferRouterInputs<Router>;
export type RouterOutputs = inferRouterOutputs<Router>;
