import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { books } from '$lib/trpc/routes/books';
import { campaigns } from '$lib/trpc/routes/campaigns';
import { users } from '$lib/trpc/routes/users';
import { storylines } from '$lib/trpc/routes/storylines';
import { chapters } from '$lib/trpc/routes/chapters';
import { deltas } from '$lib/trpc/routes/deltas';
import { notes } from '$lib/trpc/routes/notes';
import { t } from '$lib/trpc/t';
import { reviews } from './routes/reviews';

export const router = t.router({
	books,
	campaigns,
	users,
	storylines,
	chapters,
	deltas,
	notes,
	reviews
});

export type Router = typeof router;

export type RouterInputs = inferRouterInputs<Router>;
export type RouterOutputs = inferRouterOutputs<Router>;
