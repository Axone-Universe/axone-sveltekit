// src/lib/stores/supabase.ts
import { writable } from 'svelte/store';
import type { SupabaseClient } from '@supabase/supabase-js';

export const supabaseClient = writable<SupabaseClient | null>(null);

export function setSupabaseClient(client: SupabaseClient) {
	console.log('** setting sb client');
	console.log(client);
	supabaseClient.set(client);
}
