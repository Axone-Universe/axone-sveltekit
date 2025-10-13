import type { Context } from '$lib/trpc/context';
import type { Session } from '@supabase/supabase-js';

export interface Count {
	count: number;
}

export abstract class Repository {
	abstract getById(ctx?: Context, id?: string): Promise<unknown>;
}
