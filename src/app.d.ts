import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Database } from './DatabaseDefinitions';
import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from '$lib/properties/user';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			user: UserProperties;
			getSession(): Promise<Session | null>;
		}
		interface PageData {
			session: Session | null;
		}
		// interface Error {}
		// interface Platform {}
	}
}
