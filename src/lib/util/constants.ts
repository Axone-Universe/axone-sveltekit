import { type HydratedCampaignProperties, type CampaignProperties } from '$lib/properties/campaign';
import { type HydratedDocument } from 'mongoose';
import { type Currency, type CurrencyCode } from './types';

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

export const homeFilterTags = [
	'Newest',
	'Recommended',
	'Campaigns',
	'Books',
	'Past 30 Days'
] as const;

export const xrplTransactionTypes = ['Payment'] as const;

export const transactionTypes = [...xrplTransactionTypes, ...['Withdrawal']] as const;

export const transactionStatuses = ['pending', 'success', 'failed'] as const;

export const currencyCodes = ['XRP', 'USD'] as const;

export const currencies: Record<CurrencyCode, Currency> = {
	XRP: { scale: 6, code: 'XRP', symbol: 'XRP' },
	USD: { code: 'USD', symbol: '$', scale: 2 }
};

export const resourceTypes = ['image', 'video', 'audio', 'document'] as const;
