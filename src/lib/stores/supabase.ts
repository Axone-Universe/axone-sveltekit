// src/lib/stores/supabase.ts
import { writable } from 'svelte/store';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

export const supabaseClient = writable<SupabaseClient | null>(null);
export const supabaseSession = writable<Session | null>(null);

export function setSupabaseClient(client: SupabaseClient) {
	supabaseClient.set(client);
}

export function setSupabaseSession(session: Session | null) {
	supabaseSession.set(session);
}
