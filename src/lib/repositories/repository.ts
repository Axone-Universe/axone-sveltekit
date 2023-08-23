import type { Session } from '@supabase/supabase-js';

export interface Count {
	count: number;
}

export abstract class Repository {
	abstract getById(
		session: Session | null,
		id?: string,
		limit?: number,
		cursor?: string
	): Promise<unknown>;
	abstract count(): Promise<number>;
}
