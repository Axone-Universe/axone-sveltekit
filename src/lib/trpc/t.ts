import type { Context } from '$lib/trpc/context';
import { initTRPC } from '@trpc/server';
import type { OperationMeta } from 'openapi-trpc';

export const t = initTRPC.meta<OperationMeta>().context<Context>().create();
