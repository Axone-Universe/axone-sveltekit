<script lang="ts">
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import Section from '$lib/components/Section.svelte';
	import { type TransactionProperties } from '$lib/properties/transaction';
	import { trpc } from '$lib/trpc/client';
	import { type HydratedDocument } from 'mongoose';
	import { onMount, onDestroy } from 'svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { arrowLeft, checkCircle, qrcode, clockO } from 'svelte-awesome/icons';

	let transaction: HydratedDocument<TransactionProperties> | undefined;

	$: paymentData = transaction;
	$: paymentStatus = 'pending'; // 'pending', 'completed', 'failed'
	$: showSuccessModal = false;

	const pollingInterval = setInterval(checkPaymentStatus, 2000);
	let payloadId = $page.url.searchParams.get('payloadId');

	/** life cycle */

	onMount(async () => {
		const response = await trpc($page).transactions.get.query({
			payloadId: payloadId ?? ''
		});
		console.log('<< payload ', payloadId);
		console.log(response);
		paymentData = response.data as HydratedDocument<TransactionProperties>;
	});

	onDestroy(() => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
	});

	async function checkPaymentStatus() {
		try {
			// Simulate API call to check payment status
			// In real app, this would be an actual API call
			const response = await paymentCheck();

			if (response.status === 'success') {
				paymentStatus = 'completed';
				clearInterval(pollingInterval);
				showSuccessAnimation();
			} else if (response.status === 'failed') {
				paymentStatus = 'failed';
				clearInterval(pollingInterval);
			}
		} catch (error) {
			console.error('Error checking payment status:', error);
		}
	}

	async function paymentCheck() {
		// check payment

		const response = await trpc($page).transactions.get.query({
			payloadId: payloadId!
		});

		return response.data as HydratedDocument<TransactionProperties>;
	}

	function showSuccessAnimation() {
		showSuccessModal = true;
	}

	function handleBackClick() {
		window.close();
	}
</script>

<Section class="w-full min-h-screen bg-surface-50-900-token py-8 px-4">
	<div class="mx-auto w-full md:w-1/2 lg:w-1/3">
		<!-- Payment Card -->
		<div class="card bg-surface-200-700-token p-8 mb-6">
			<!-- Payment Status -->
			<div class="text-center mb-6">
				{#if paymentStatus === 'pending'}
					<div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
						<Icon class="w-5 h-5 mr-2" data={qrcode} scale={1.2} />
					</div>
					<h2 class="text-lg font-semibold mb-2">Scan to Pay</h2>
					<p class="text-sm">Use your Xaman app to scan the QR code</p>
				{:else if paymentStatus === 'completed'}
					<button
						class="btn-icon w-16 h-16 mx-auto mb-4 bg-success-50-900-token flex items-center justify-center"
					>
						<Icon class="w-8 h-8" data={checkCircle} scale={2} />
					</button>
					<h2 class="text-lg font-semibold text-success-800-100-token mb-2">Payment Successful!</h2>
					<p class=" text-sm">Thank you for your support</p>
				{:else if paymentStatus === 'failed'}
					<div
						class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center"
					>
						<Icon class="w-5 h-5 mr-2" data={clockO} scale={1.2} />
					</div>
					<h2 class="text-lg font-semibold text-red-900 mb-2">Payment Failed</h2>
					<p class="text-red-600 text-sm">Please try again or contact support</p>
				{/if}
			</div>

			<!-- QR Code -->
			{#if paymentStatus === 'pending'}
				<div class=" rounded-xl p-8 mb-6 text-center">
					<!-- Mock QR Code - In real app, use a QR code library -->
					<div class="w-48 h-48 mx-auto rounded-lg flex items-center justify-center">
						<div class="text-center">
							<img
								class="h-auto max-w-full rounded-lg"
								src={`${paymentData?.payload?.refs.qr_png ?? ''}`}
								alt=""
							/>
						</div>
					</div>
				</div>
			{/if}

			<!-- Payment Details -->
			<div class="rounded-lg bg-surface-400-500-token shadow-md p-4 mb-6">
				<h3 class="font-medium mb-3">Payment Details</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="">Amount:</span>
						<span class="font-medium"
							>{paymentData?.currency === 'XRP'
								? `XRP ${paymentData?.netValue?.toFixed(6)}`
								: `$${paymentData?.netValue?.toFixed(2)}`}</span
						>
					</div>
					<div class="flex justify-between">
						<span class="">Platform fee:</span>
						<span class="font-medium"
							>{paymentData?.currency === 'XRP'
								? `XRP ${paymentData?.fee?.toFixed(6)}`
								: `$${paymentData?.fee?.toFixed(2)}`}</span
						>
					</div>
					<div class="flex justify-between">
						<span class="">Transaction Type:</span>
						<span class="font-medium capitalize">{paymentData?.type}</span>
					</div>
					<div class="border-t border-surface-700-200-token pt-2 mt-2">
						<div class="flex justify-between font-semibold">
							<span>Total:</span>
							<span
								>{paymentData?.currency === 'XRP'
									? `XRP ${paymentData?.value?.toFixed(6)}`
									: `$${paymentData?.value?.toFixed(2)}`}</span
							>
						</div>
					</div>
				</div>
			</div>

			<!-- Message -->
			{#if paymentData?.note}
				<div class="bg-purple-50 rounded-lg p-4 mb-6">
					<h4 class="font-medium text-purple-900 mb-2">Your Message:</h4>
					<p class="text-purple-700 text-sm italic">"{paymentData.note}"</p>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex flex-col items-center mb-6">
			{#if paymentStatus === 'pending'}
				<button on:click={handleBackClick} class="btn bg-error-500-400-token variant-filled">
					Cancel Payment
				</button>
			{:else}
				<button on:click={handleBackClick} class="btn bg-success-600-300-token variant-filled">
					Done
				</button>
			{/if}
		</div>

		<!-- Instructions -->
		{#if paymentStatus === 'pending'}
			<div class="card p-6">
				<h3 class="font-medium mb-3">How to pay:</h3>
				<ul class="space-y-2 text-sm !list-none">
					<li class="flex items-start">
						<span class="btn-icon bg-surface-400-500-token !w-6 !h-6 text-xs mr-2">1</span>
						Open your
						<a
							target="_blank"
							href="https://play.google.com/store/apps/details?id=com.xrpllabs.xumm&pcampaignid=web_share"
							class="text-blue-600 dark:text-blue-500 hover:underline">Xaman</a
						> wallet app
					</li>
					<li class="flex items-start">
						<span class="btn-icon bg-surface-400-500-token !w-6 !h-6 text-xs mr-2">2</span>
						Scan the QR code above
					</li>
					<li class="flex items-start">
						<span class="btn-icon bg-surface-400-500-token !w-6 !h-6 text-xs mr-2">3</span>
						Confirm the payment amount
					</li>
					<li class="flex items-start">
						<span class="btn-icon bg-surface-400-500-token !w-6 !h-6 text-xs mr-2">4</span>
						Complete the transaction
					</li>
				</ul>
			</div>
		{/if}
	</div>
</Section>
