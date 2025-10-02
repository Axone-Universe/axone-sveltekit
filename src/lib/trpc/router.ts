import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import { accounts } from '$lib/trpc/routes/accounts';
import { books } from '$lib/trpc/routes/books';
import { xumm } from '$lib/trpc/routes/xumm';
import { transactions } from '$lib/trpc/routes/transactions';
import { resources } from '$lib/trpc/routes/resources';
import { campaigns } from '$lib/trpc/routes/campaigns';
import { users } from '$lib/trpc/routes/users';
import { storylines } from '$lib/trpc/routes/storylines';
import { chapters } from '$lib/trpc/routes/chapters';
import { deltas } from '$lib/trpc/routes/deltas';
import { notes } from '$lib/trpc/routes/notes';
import { t } from '$lib/trpc/t';
import { reviews } from './routes/reviews';
import { notifications } from './routes/notifications';
import { readingLists } from './routes/readingLists';

export const router = t.router({
	accounts,
	books,
	campaigns,
	users,
	storylines,
	chapters,
	deltas,
	notes,
	reviews,
	notifications,
	transactions,
	resources,
	xumm,
	readingLists
});

export type Router = typeof router;

export type RouterInputs = inferRouterInputs<Router>;
export type RouterOutputs = inferRouterOutputs<Router>;
