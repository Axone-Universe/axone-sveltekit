import type { Session } from '@supabase/supabase-js';

export interface Count {
	count: number;
}

export abstract class Repository {
	abstract getById(session: Session | null, id?: string): Promise<unknown>;
	abstract count(): Promise<number>;
}
