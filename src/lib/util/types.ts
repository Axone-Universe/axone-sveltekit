import type { Bucket, FileObject, StorageError as SupabasStorageError } from '@supabase/storage-js';
import type { IconData } from 'svelte-awesome/components/Icon.svelte';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
	currencyCodes,
	homeFilterTags,
	notificationTypes,
	paymentMethods,
	transactionStatuses,
	transactionTypes,
	visibleDocuments,
	xrplTransactionTypes
} from './constants';
import { resourceTypes } from '$lib/properties/resource';

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

export type HomeFilterTag = (typeof homeFilterTags)[number];

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

export type NotificationType = (typeof notificationTypes)[number];

export type PaymentMethod = (typeof paymentMethods)[number];

// These are the types we support currently. We are not using all the types from the lib
export type XrplTransactionType = (typeof xrplTransactionTypes)[number];

export type TransactionType = (typeof transactionTypes)[number];

export type TransactionStatus = (typeof transactionStatuses)[number];

export type CurrencyCode = (typeof currencyCodes)[number];

export type Currency = { code: string; scale: number; symbol: string };

export type VisibleDocument = (typeof visibleDocuments)[number];
