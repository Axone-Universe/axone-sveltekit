import type { Bucket, FileObject, StorageError as SupabasStorageError } from '@supabase/storage-js';
import type { IconData } from 'svelte-awesome/components/Icon.svelte';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NotificationTypes } from './constants';

export const EditorModes = ['reader', 'writer'] as const;
export type EditorMode = (typeof EditorModes)[number];

export interface EditorMenuItem {
	id: string;
	label: string;
	icon: Record<string, IconData>;
	callback(): void;
	class?: string;
	notification?: string | number;
	pulse?: boolean;
	mode?: EditorMode;
	hidden?: boolean;
}

export interface RowAction {
	label: string;
	icon: Record<string, IconData>;
	callback(arg: any): void;
	class?: string;
	notification?: string | number;
	scale?: number;
}

export type Response = {
	message: string;
	success: boolean;
	data?: unknown;
	cursor?: number | undefined;
};

export const HOME_FILTER_TAGS = [
	'Newest',
	'Recommended',
	'Campaigns',
	'Books',
	'Past 30 Days'
] as const;
export type HomeFilterTag = (typeof HOME_FILTER_TAGS)[number];

export type StorageError =
	| { data: { path: string }; error: null }
	| { data: null; error: { name: string; statusCode?: string } };

export type StorageBucketError =
	| { data: Bucket; error: null }
	| { data: null; error: SupabasStorageError };

export type StorageFileError =
	| { data: FileObject[]; error: null }
	| { data: null; error: SupabasStorageError };

export interface UploadFileToBucketParams {
	supabase: SupabaseClient;
	file: File;
	bucket: string;
	newFileName: string | undefined;
}

export type NotificationType = (typeof NotificationTypes)[number];
