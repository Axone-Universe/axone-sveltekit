import type { Bucket, StorageError as SupabasStorageError, FileObject } from '@supabase/storage-js';
import type { IconData } from 'svelte-awesome/components/Icon.svelte';

export interface DeltaQuery {
	id?: string;
	chapterID: string;
	ops?: string;
}

export interface CampaignProperties {
	id?: string;
	title: string;
	organizer: { name: string; link: string };
	dates: {
		startDate: Date;
		endDate: Date;
		event: string;
	}[];
	about: string;
	tags: string[];
	bannerURL: string;
	submissionCriteria: string;
	rewards: string;
	previewText: string;
}

export const EditorModes = ['reader', 'writer'] as const;
export type EditorMode = (typeof EditorModes)[number];

export interface EditorMenuItem {
	label: string;
	icon: Record<string, IconData>;
	callback(): void;
	class?: string;
	notification?: string | number;
	pulse?: boolean;
	mode?: EditorMode;
}

export interface NodeRelationship {
	name: string;
	label: string;
}

export type StorageError =
	| { data: { path: string }; error: null }
	| { data: null; error: { name: string; statusCode?: string } };

export type StorageBucketError =
	| { data: Bucket; error: null }
	| { data: null; error: SupabasStorageError };

export type StorageFileError =
	| { data: FileObject[]; error: null }
	| { data: null; error: SupabasStorageError };
