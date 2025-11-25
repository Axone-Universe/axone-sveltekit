<script lang="ts">
	import { page } from '$app/stores';
	import { trpcWithQuery } from '$lib/trpc/client';
	import { Copy, Check, Users, UserPlus, TrendingUp } from 'lucide-svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import type { ToastSettings } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';
	import { PUBLIC_DOMAIN_NAME } from '$env/static/public';

	export let data: PageData;

	const toastStore = getToastStore();
	let copied = false;

	// Generate referral link
	$: referralLink = data.session?.user?.id
		? `${PUBLIC_DOMAIN_NAME}sign-up?ref=${data.session.user.id}`
		: '';

	// Fetch referral count
	$: referralCountQuery = trpcWithQuery($page).users.getReferralCount.createQuery();

	$: referralCount = $referralCountQuery.data?.data?.count ?? 0;
	$: referralPoints = referralCount * 10;

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(referralLink);
			copied = true;
			const toast: ToastSettings = {
				message: 'Referral link copied to clipboard!',
				background: 'variant-filled-success'
			};
			toastStore.trigger(toast);

			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (error) {
			const toast: ToastSettings = {
				message: 'Failed to copy link',
				background: 'variant-filled-error'
			};
			toastStore.trigger(toast);
		}
	}
</script>

<div class="w-full min-h-screen p-4 md:p-8 space-y-8">
	<!-- Page Header -->
	<div class="space-y-2">
		<h1 class="h1 font-bold">Referral Dashboard</h1>
		<p class="text-surface-600-300-token">
			Share your unique referral link and earn 10 points for every new user who signs up!
		</p>
	</div>

	<!-- Referral Link Card -->
	<div class="card p-6 space-y-4">
		<div class="flex items-center gap-2">
			<UserPlus size={24} class="text-primary-500" />
			<h2 class="h3 font-semibold">Your Referral Link</h2>
		</div>

		<div class="flex flex-col md:flex-row gap-4">
			<input
				type="text"
				readonly
				value={referralLink}
				class="input flex-1"
				placeholder="Loading your referral link..."
			/>
			<button
				class="btn variant-filled-primary min-w-[120px]"
				on:click={copyToClipboard}
				disabled={!referralLink}
			>
				{#if copied}
					<Check size={20} />
					<span>Copied!</span>
				{:else}
					<Copy size={20} />
					<span>Copy Link</span>
				{/if}
			</button>
		</div>

		<div class="text-sm text-surface-600-300-token">
			<p>Share this link with friends, family, or on social media to invite them to join Axone.</p>
		</div>
	</div>

	<!-- Metrics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<!-- Total Referrals -->
		<div class="card p-6 space-y-2">
			<div class="flex items-center justify-between">
				<h3 class="h4 font-semibold">Total Referrals</h3>
				<Users size={24} class="text-primary-500" />
			</div>
			{#if $referralCountQuery.isLoading}
				<p class="text-4xl font-bold animate-pulse">...</p>
			{:else}
				<p class="text-4xl font-bold">{referralCount}</p>
			{/if}
			<p class="text-sm text-surface-600-300-token">Users you've referred</p>
		</div>

		<!-- Points Earned -->
		<div class="card p-6 space-y-2">
			<div class="flex items-center justify-between">
				<h3 class="h4 font-semibold">Points Earned</h3>
				<TrendingUp size={24} class="text-success-700-200-token" />
			</div>
			{#if $referralCountQuery.isLoading}
				<p class="text-4xl font-bold animate-pulse">...</p>
			{:else}
				<p class="text-4xl font-bold text-success-700-200-token">{referralPoints}</p>
			{/if}
			<p class="text-sm text-surface-600-300-token">10 points per referral</p>
		</div>

		<!-- Conversion Rate -->
		<div class="card p-6 space-y-2">
			<div class="flex items-center justify-between">
				<h3 class="h4 font-semibold">Status</h3>
				<div class="badge variant-filled-primary">Active</div>
			</div>
			<p class="text-2xl font-bold">Ambassador</p>
			<p class="text-sm text-surface-600-300-token">Keep sharing to earn more!</p>
		</div>
	</div>

	<!-- How It Works -->
	<div class="card p-6 space-y-4">
		<h2 class="h3 font-semibold">How It Works</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="space-y-2">
				<div
					class="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold"
				>
					1
				</div>
				<h3 class="font-semibold">Share Your Link</h3>
				<p class="text-sm text-surface-600-300-token">
					Copy your unique referral link and share it with friends, family, or on social media.
				</p>
			</div>
			<div class="space-y-2">
				<div
					class="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold"
				>
					2
				</div>
				<h3 class="font-semibold">They Sign Up</h3>
				<p class="text-sm text-surface-600-300-token">
					When someone uses your link to create an account, they'll be tracked as your referral.
				</p>
			</div>
			<div class="space-y-2">
				<div
					class="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold"
				>
					3
				</div>
				<h3 class="font-semibold">Earn Points</h3>
				<p class="text-sm text-surface-600-300-token">
					You'll automatically earn 10 points for each successful referral that you can redeem for
					rewards!
				</p>
			</div>
		</div>
	</div>
</div>
