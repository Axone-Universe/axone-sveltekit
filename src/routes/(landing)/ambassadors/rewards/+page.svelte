<script lang="ts">
	import { page } from '$app/stores';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
	import { Gift, Award, TrendingUp, ExternalLink } from 'lucide-svelte';
	import { getToastStore, getModalStore } from '@skeletonlabs/skeleton';
	import type { ToastSettings, ModalSettings } from '@skeletonlabs/skeleton';
	import { rewardTiers } from '$lib/util/constants';
	import type { RewardTier } from '$lib/util/constants';

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	let isRedeeming = false;
	let redeemingRewardPoints: number | null = null;

	// Fetch referral count to calculate earned points
	$: referralCountQuery = trpcWithQuery($page).users.getReferralCount.createQuery();
	$: referralCount = $referralCountQuery.data?.data?.count ?? 0;
	$: totalEarnedPoints = referralCount * 10;

	// Fetch redemption transactions to calculate used points
	// User is the receiver (receiving voucher from platform/admin)
	$: redemptionTransactionsQuery = trpcWithQuery($page).transactions.get.createQuery({
		receiverId: $page.data.session?.user.id,
		limit: 1000
	});

	$: redemptionTransactions = ($redemptionTransactionsQuery.data?.data?.filter(
		(txn: any) => txn.type === 'Redemption'
	) ?? []) as any[];
	// Extract points from documentId field (where points are stored for tracking)
	$: usedPoints = redemptionTransactions.reduce((sum: number, txn: any) => {
		const points = parseInt(txn.documentId ?? '0', 10);
		return sum + points;
	}, 0) as number;
	$: totalPoints = totalEarnedPoints - usedPoints;

	function confirmRedemption(reward: RewardTier) {
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

	async function redeemReward(reward: RewardTier) {
		isRedeeming = true;
		redeemingRewardPoints = reward.points;

		// Show processing toast
		const processingToast: ToastSettings = {
			message: `Processing redemption for ${reward.label}...`,
			background: 'variant-filled-secondary',
			autohide: false
		};
		const processingToastId = toastStore.trigger(processingToast);

		try {
			const response = await trpc($page).transactions.redeemReward.mutate({
				points: reward.points,
				rewardType: reward.rewardType,
				rewardValue: reward.value,
				currency: reward.currency
			});

			// Close processing toast
			toastStore.close(processingToastId);

			if (response.success) {
				const successToast: ToastSettings = {
					message: `Successfully redeemed ${reward.label}! Check your email within 24-48 hours.`,
					background: 'variant-filled-success',
					timeout: 7000
				};
				toastStore.trigger(successToast);

				// Refetch both queries to update points
				await Promise.all([$referralCountQuery.refetch(), $redemptionTransactionsQuery.refetch()]);
			} else {
				const errorToast: ToastSettings = {
					message: response.message || 'Failed to redeem reward. Please try again later.',
					background: 'variant-filled-error',
					timeout: 5000
				};
				toastStore.trigger(errorToast);
			}
		} catch (error) {
			// Close processing toast
			toastStore.close(processingToastId);

			const errorToast: ToastSettings = {
				message: 'An error occurred while processing your redemption. Please try again later.',
				background: 'variant-filled-error',
				timeout: 5000
			};
			toastStore.trigger(errorToast);
			console.error('Redemption error:', error);
		} finally {
			isRedeeming = false;
			redeemingRewardPoints = null;
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
				{#if $referralCountQuery.isLoading || $redemptionTransactionsQuery.isLoading}
					<p class="text-5xl font-bold animate-pulse">...</p>
				{:else}
					<p class="text-5xl font-bold">{totalPoints}</p>
				{/if}
				<div class="text-sm opacity-90 space-y-1">
					<p>{referralCount} referrals × 10 = {totalEarnedPoints} points earned</p>
					{#if usedPoints > 0}
						<p>- {usedPoints} points redeemed</p>
						<p class="font-semibold">= {totalPoints} points available</p>
					{/if}
				</div>
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
						<Gift size={32} class={canRedeem ? 'text-success-700-200-token' : 'text-surface-400'} />
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
						class="btn w-full {canRedeem && !isRedeeming
							? 'variant-filled-success bg-success-700-200-token'
							: 'variant-ghost-surface'}"
						disabled={!canRedeem || isRedeeming}
						on:click={() => confirmRedemption(reward)}
					>
						{#if isRedeeming && redeemingRewardPoints === reward.points}
							<div class="flex items-center gap-2">
								<svg
									class="animate-spin h-5 w-5"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								<span>Processing...</span>
							</div>
						{:else if canRedeem}
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
