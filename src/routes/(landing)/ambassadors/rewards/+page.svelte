<script lang="ts">
	import { page } from '$app/stores';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
	import { Gift, Award, TrendingUp, ExternalLink } from 'lucide-svelte';
	import { getToastStore, getModalStore } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ModalSettings } from '@skeletonlabs/skeleton';

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	// Fetch referral count to calculate points
	$: referralCountQuery = trpcWithQuery($page).users.getReferralCount.createQuery();
	$: referralCount = $referralCountQuery.data?.data?.count ?? 0;
	$: totalPoints = referralCount * 10;

	// Reward tiers for Takealot vouchers
	const rewardTiers = [
		{ points: 100, value: 100, label: 'R100 Takealot Voucher' },
		{ points: 250, value: 250, label: 'R250 Takealot Voucher' },
		{ points: 500, value: 500, label: 'R500 Takealot Voucher' },
		{ points: 1000, value: 1000, label: 'R1000 Takealot Voucher' }
	];

	function confirmRedemption(reward: { points: number; value: number; label: string }) {
		const modal: ModalSettings = {
			type: 'confirm',
			title: 'Confirm Redemption',
			body: `Are you sure you want to redeem ${reward.points} points for a ${reward.label}? This action cannot be undone.`,
			response: async (confirmed: boolean) => {
				if (confirmed) {
					await redeemReward(reward);
				}
			}
		};
		modalStore.trigger(modal);
	}

	async function redeemReward(reward: { points: number; value: number; label: string }) {
		try {
			const response = await trpc($page).users.redeemReward.mutate({
				points: reward.points,
				rewardType: 'takealot_voucher',
				rewardValue: reward.value
			});

			if (response.success) {
				const toast: ToastSettings = {
					message: `Successfully redeemed ${reward.label}! Check your email for details.`,
					background: 'variant-filled-success',
					timeout: 5000
				};
				toastStore.trigger(toast);

				// Refetch the referral count to update points
				$referralCountQuery.refetch();
			}
		} catch (error) {
			const toast: ToastSettings = {
				message: 'Failed to redeem reward. Please try again later.',
				background: 'variant-filled-error'
			};
			toastStore.trigger(toast);
		}
	}
</script>

<div class="w-full min-h-screen p-4 md:p-8 space-y-8">
	<!-- Page Header -->
	<div class="space-y-2">
		<h1 class="h1 font-bold">Ambassador Rewards</h1>
		<p class="text-surface-600-300-token">
			Redeem your hard-earned points for Takealot gift vouchers and other exciting rewards!
		</p>
	</div>

	<!-- Points Balance Card -->
	<div class="card p-6 bg-gradient-to-br from-primary-500 to-secondary-500 text-white space-y-4">
		<div class="flex items-center justify-between">
			<div class="space-y-2">
				<p class="text-sm opacity-90">Your Points Balance</p>
				{#if $referralCountQuery.isLoading}
					<p class="text-5xl font-bold animate-pulse">...</p>
				{:else}
					<p class="text-5xl font-bold">{totalPoints}</p>
				{/if}
				<p class="text-sm opacity-90">
					{referralCount} referrals × 10 points = {totalPoints} points
				</p>
			</div>
			<Award size={64} class="opacity-80" />
		</div>

		<div class="flex items-center gap-2 text-sm">
			<TrendingUp size={16} />
			<span>Keep referring to earn more points!</span>
		</div>
	</div>

	<!-- Reward Tiers -->
	<div class="space-y-4">
		<h2 class="h2 font-semibold">Available Rewards</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each rewardTiers as reward}
				{@const canRedeem = totalPoints >= reward.points}
				{@const progress = Math.min((totalPoints / reward.points) * 100, 100)}

				<div class="card p-6 space-y-4 {canRedeem ? 'ring-2 ring-success-500' : ''}">
					<div class="flex items-start justify-between">
						<div class="space-y-1">
							<h3 class="h4 font-semibold">{reward.label}</h3>
							<p class="text-sm text-surface-600-300-token">
								Cost: {reward.points} points
							</p>
						</div>
						<Gift size={32} class={canRedeem ? 'text-success-500' : 'text-surface-400'} />
					</div>

					<!-- Progress Bar -->
					<div class="space-y-2">
						<div class="h-2 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
							<div
								class="h-full bg-gradient-to-r from-primary-500 to-success-500 transition-all duration-500"
								style="width: {progress}%"
							/>
						</div>
						<p class="text-xs text-surface-600-300-token text-right">
							{totalPoints} / {reward.points} points
						</p>
					</div>

					<!-- Redeem Button -->
					<button
						class="btn w-full {canRedeem ? 'variant-filled-success' : 'variant-ghost-surface'}"
						disabled={!canRedeem}
						on:click={() => confirmRedemption(reward)}
					>
						{#if canRedeem}
							<Gift size={20} />
							<span>Redeem Now</span>
						{:else}
							<span>Need {reward.points - totalPoints} more points</span>
						{/if}
					</button>
				</div>
			{/each}
		</div>
	</div>

	<!-- Info Section -->
	<div class="card p-6 space-y-4 variant-soft-primary">
		<div class="flex items-center gap-2">
			<Gift size={24} />
			<h2 class="h3 font-semibold">About Rewards</h2>
		</div>

		<div class="space-y-3 text-sm">
			<div class="flex gap-3">
				<span class="text-primary-500 font-bold">•</span>
				<p>
					Rewards are delivered via email within 24-48 hours after redemption. Please check your
					spam folder if you don't see it.
				</p>
			</div>
			<div class="flex gap-3">
				<span class="text-primary-500 font-bold">•</span>
				<p>
					Takealot vouchers can be used on <a
						href="https://www.takealot.com"
						target="_blank"
						rel="noopener noreferrer"
						class="anchor inline-flex items-center gap-1"
					>
						takealot.com
						<ExternalLink size={14} />
					</a> for any product available on their platform.
				</p>
			</div>
			<div class="flex gap-3">
				<span class="text-primary-500 font-bold">•</span>
				<p>Points cannot be refunded or exchanged for cash once redeemed.</p>
			</div>
			<div class="flex gap-3">
				<span class="text-primary-500 font-bold">•</span>
				<p>
					More reward options coming soon! Stay tuned for exclusive Axone merchandise and premium
					features.
				</p>
			</div>
		</div>
	</div>

	<!-- Earning More Points -->
	<div class="card p-6 space-y-4">
		<h2 class="h3 font-semibold">Want More Points?</h2>
		<p class="text-surface-600-300-token">
			Head over to the <a href="/ambassadors/referrals" class="anchor">Referrals page</a> to get your
			unique referral link and start inviting more users to Axone!
		</p>
		<a href="/ambassadors/referrals" class="btn variant-filled-primary w-fit">
			<TrendingUp size={20} />
			<span>Go to Referrals</span>
		</a>
	</div>
</div>
