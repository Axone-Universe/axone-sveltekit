import type { Session } from '@supabase/supabase-js';

export interface Count {
	count: number;
}

export abstract class Repository {
	abstract getById(
		session: Session,
		searchTerm?: string,
		limit?: number,
		skip?: number
	): Promise<unknown>;
	abstract count(): Promise<number>;
}
