import { type HydratedCampaignProperties, type CampaignProperties } from '$lib/properties/campaign';
import { type HydratedDocument } from 'mongoose';
import { type Currency, type CurrencyCode } from './types';

import { label as BookLabel } from '$lib/properties/book';
import { label as StorylineLabel } from '$lib/properties/storyline';
import { label as ChapterLabel } from '$lib/properties/chapter';
import { type HydratedResourceProperties, label as ResourceLabel } from '$lib/properties/resource';
import { uploadImage } from './bucket/bucket';
import { SupabaseClient } from '@supabase/supabase-js';

export const formatDate = (date: Date) => {
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	});
};

const units = [
	{ label: 'year', seconds: 31536000 },
	{ label: 'month', seconds: 2592000 },
	{ label: 'week', seconds: 604800 },
	{ label: 'day', seconds: 86400 },
	{ label: 'hour', seconds: 3600 },
	{ label: 'minute', seconds: 60 },
	{ label: 'second', seconds: 1 }
];

export const notificationTypes = ['USER', 'TOPIC'] as const;

export const paymentMethods = ['xaman', 'mastercard', 'visa'] as const;

export const timeAgo = (date: string | number | Date) => {
	const time = Math.floor((new Date().valueOf() - new Date(date).valueOf()) / 1000);
	const { interval, unit } = calculateTimeDifference(time);
	const suffix = interval === 1 ? '' : 's';
	return `${interval} ${unit}${suffix} ago`;
};

const calculateTimeDifference = (time: number) => {
	for (const { label, seconds } of units) {
		const interval = Math.floor(time / seconds);
		if (interval >= 1) {
			return {
				interval: interval,
				unit: label
			};
		}
	}
	return {
		interval: 0,
		unit: ''
	};
};

export const campaignDaysLeft = (
	campaign: HydratedDocument<CampaignProperties | HydratedCampaignProperties> | undefined
): [number, string] => {
	if (!campaign) {
		return [0, ''];
	}

	// One day in milliseconds
	const oneDay = 1000 * 60 * 60 * 24;

	const campaignEndDate = new Date(campaign.endDate as unknown as string);

	// Calculating the time difference between two dates
	const diffInTime = campaignEndDate.getTime() - new Date().getTime();

	// Calculating the no. of days between two dates
	const diffInDays = Math.round(diffInTime / oneDay);

	let color = 'variant-filled-success';
	if (diffInDays >= 0 && diffInDays <= 2) {
		color = 'variant-filled-warning';
	} else if (diffInDays < 0) {
		color = 'variant-filled-error';
	}

	return [diffInDays, color];
};

/**
 * Uploads an resource to supabase storage
 * @param newResourceFile - the file to upload or the event that contains the file
 * @param resource - the resource
 */
export async function uploadResource(
	newResourceFile: File | Event,
	resource: HydratedDocument<HydratedResourceProperties>,
	supabase: SupabaseClient | null,
	toastStore: any
): Promise<{ success: boolean; message: string }> {
	if (!supabase) {
		return { success: false, message: 'Supabase client is not defined' };
	}
	// if the file is an event, get the file from the event
	if (newResourceFile instanceof Event) {
		newResourceFile = (newResourceFile.target as HTMLInputElement)?.files?.[0] as File;
	}

	if (!newResourceFile) {
		return { success: false, message: 'No file selected' }; // No file selected
	}

	const chapterId = resource.chapter?._id;
	const bookId = resource.chapter?.book;

	//retrieve supabase storage bucket
	const bucketName = `books/${bookId}/chapters/${chapterId}`;

	const response = await uploadImage(supabase, bucketName, newResourceFile as File, toastStore);

	if (response.url && response.url !== null) {
		resource.src = response.url;
		return { success: true, message: 'Resource successfully uploaded' };
	} else {
		return { success: false, message: response.error?.message ?? 'Error uploading resource' };
	}
}

export const homeFilterTags = [
	'Newest',
	'Recommended',
	'Campaigns',
	'Books',
	'Past 30 Days'
] as const;

export const xrplTransactionTypes = ['Payment', 'NFTokenMint'] as const;

export const transactionTypes = [...xrplTransactionTypes, ...['Withdrawal']] as const;

export const transactionStatuses = ['pending', 'success', 'failed'] as const;

export const currencyCodes = ['XRP', 'USD'] as const;

export const currencies: Record<CurrencyCode, Currency> = {
	XRP: { scale: 6, code: 'XRP', symbol: 'XRP' },
	USD: { code: 'USD', symbol: '$', scale: 2 }
};

export const visibleDocuments = [BookLabel, ChapterLabel, StorylineLabel, ResourceLabel] as const;
