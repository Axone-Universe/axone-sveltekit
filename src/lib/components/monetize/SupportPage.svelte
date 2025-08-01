<script lang="ts">
	import { type PermissionedDocument } from '$lib/properties/permission';
	import { type PaymentMethod } from '$lib/util/types';
	import { PUBLIC_PLATFORM_FEES } from '$env/static/public';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { heartO, ccMastercard, ccVisa, bitcoin } from 'svelte-awesome/icons';
	import Section from '../Section.svelte';
	import { type UserProperties } from '$lib/properties/user';
	import { paymentMethods } from '$lib/util/constants';
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { type TransactionProperties } from '$lib/properties/transaction';
	import Tooltip from '../Tooltip.svelte';
	import { supabaseSession } from '$lib/stores/supabase';
	import { documentURL } from '$lib/util/links';

	/** props */
	export let documentType: PermissionedDocument;
	export let document: HydratedDocument<any>;
	export let creator: HydratedDocument<UserProperties>;

	let customClass = '';
	export { customClass as class };

	/** constants */
	const usdToXrpRateInterval = setInterval(() => {
		getRates();
	}, 10000);

	// let xumm: Xumm;

	/** life cycle */
	onMount(async () => {
		getRates();
	});

	onDestroy(() => clearInterval(usdToXrpRateInterval));

	// State management using traditional Svelte syntax
	let selectedAmount = 0;
	let customAmount = '';
	let note = '';
	let selectedPaymentMethod: PaymentMethod = 'xaman';
	let isProcessing = false;

	// Preset amounts
	const presetAmounts = [1, 2, 3, 5, 8];

	// Platform fee rate (3%)
	const feeRate = Number(PUBLIC_PLATFORM_FEES);

	$: session = $supabaseSession;

	// Reactive statements for derived values
	$: netAmount = selectedAmount || parseFloat(customAmount) || 0;
	$: platformFee = netAmount * feeRate;
	$: totalAmount = netAmount + platformFee;
	$: isValidAmount = netAmount > 0;
	$: canSubmit = isValidAmount && selectedPaymentMethod && !isProcessing;

	// xrp values
	$: usdToXrpRate = 0;
	$: totalAmountXRP = Number((usdToXrpRate * totalAmount).toFixed(6));
	$: netAmountXRP = Number((usdToXrpRate * netAmount).toFixed(6));
	$: platformFeeXRP = Number((usdToXrpRate * platformFee).toFixed(6));

	// Functions
	function selectPresetAmount(amount: number) {
		selectedAmount = amount;
		customAmount = '';
	}

	function handleCustomAmountChange(event: any) {
		const value = event.target.value;
		customAmount = value;
		selectedAmount = 0;
	}

	function selectPaymentMethod(method: PaymentMethod) {
		selectedPaymentMethod = method;
	}

	async function getRates() {
		console.log('getting rates...');

		const response = await trpc($page).xumm.getRates.query({
			currencyCode: 'USD'
		});

		console.log('<< rates');
		console.log(response);

		usdToXrpRate = response.data.XRP;
		return usdToXrpRate;
	}

	async function handleSubmit() {
		if (!canSubmit) return;

		isProcessing = true;

		let notifications: any = {};
		notifications[creator._id] = {
			type: 'USER',
			senderID: session?.user.id,
			receiverID: creator._id,
			subject: 'Incoming support payment!',
			url: $page.url.origin + '/monetize/earnings',
			notification: `You have received a pending amount of ${netAmountXRP} XRP from a supporter!`
		};

		try {
			if (selectedPaymentMethod === 'xaman') {
				const response = await trpc($page).xumm.payload.query({
					transactionType: 'Payment',
					netValue: netAmountXRP,
					documentId: document._id,
					documentType: documentType,
					receiver: creator._id,
					note: note,
					currency: selectedPaymentMethod === 'xaman' ? 'XRP' : 'USD',
					notifications: notifications
				});

				console.log('<< Create Payload');
				console.log(response);

				const transaction = response.data as HydratedDocument<TransactionProperties>;
				window.open(`/payment?payloadId=${transaction.payload?.uuid}`, '_blank');
			}

			// Here you would integrate with actual payment processing
			console.log('Payment submitted:', {
				amount: netAmount,
				fee: platformFee,
				total: totalAmount,
				message: note,
				paymentMethod: selectedPaymentMethod
			});

			// Reset form
			selectedAmount = 0;
			customAmount = '';
			note = '';
			selectedPaymentMethod = 'xaman';
		} catch (error) {
			console.log(error);
		} finally {
			isProcessing = false;
		}
	}
</script>

<Section class="{customClass} min-h-screen py-8 px-4 w-modal">
	<div class="max-w-2xl mx-auto">
		<!-- Author Profile Section -->
		<div class="card rounded-2xl shadow-lg p-8 mb-8">
			<div class="flex items-center space-x-4 mb-6">
				<Avatar src={creator.imageURL} width="w-20" rounded="rounded-full" />
				<div>
					<h1 class="text-2xl font-bold">{creator.firstName} {creator.lastName}</h1>
					<div class="my-2 flex space-x-2">
						{#if creator.labels}
							{#each creator.labels as label}
								<div class="chip variant-filled">{label}</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
			<p class="leading-relaxed">
				{creator.about}
			</p>
		</div>

		<!-- Payment Form -->
		<div class="card rounded-2xl shadow-lg p-8">
			<h2 class="text-xl font-semibold mb-6 flex items-center">
				<Icon class="w-5 h-5 text-red-500 mr-2" data={heartO} scale={1.2} />
				Support {creator.firstName}'s Work
			</h2>

			<!-- Amount Selection -->
			<div class="mb-6">
				<label for="presetAmounts" class="block text-sm font-medium mb-3">
					Choose your support amount
				</label>
				<div class="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
					{#each presetAmounts as amount}
						<button
							id="btn presetAmounts"
							on:click={() => selectPresetAmount(amount)}
							class="btn variant-ghost flex items-center justify-center px-2 py-2
							{selectedAmount === amount ? '!bg-surface-50-900-token' : ''}"
						>
							${amount}
						</button>
					{/each}
				</div>
				<div class="relative">
					<span class="absolute left-3 top-1/2 transform -translate-y-1/2 font-medium">$</span>
					<input
						id="customAmount"
						class="input pl-8 pr-4 py-3"
						type="number"
						bind:value={customAmount}
						on:input={handleCustomAmountChange}
						placeholder="Custom Amount"
						required
					/>
				</div>
			</div>

			<!-- Message Section -->
			<div class="mb-6">
				<label for="messageInput" class="block text-sm font-medium mb-2">
					Leave a message (optional)
				</label>
				<textarea
					id="messageInput"
					class="textarea w-full h-full overflow-hidden"
					bind:value={note}
					placeholder="Share your thoughts or encouragement..."
					rows="3"
					required
				/>
			</div>

			<!-- Payment Method Selection -->
			<div class="mb-6">
				<label for="paymentMethod" class="block text-sm font-mediummb-3"> Payment Method </label>
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
					{#each paymentMethods as method}
						<Tooltip
							on:click={() => selectPaymentMethod(method)}
							content={method !== 'xaman' ? 'coming soon' : 'pay with XRP'}
							placement="top"
							target="{method}-btn"
						>
							<button
								disabled={method !== 'xaman'}
								id="{method}-btn"
								class="btn w-full variant-ghost flex items-center justify-center px-2 py-2
						{selectedPaymentMethod === method ? '!bg-surface-50-900-token' : ''}"
							>
								<Icon
									class="w-5 h-5 mr-2"
									data={method === 'xaman' ? bitcoin : method === 'visa' ? ccVisa : ccMastercard}
									scale={1.2}
								/>
								<span class="font-medium">{method}</span>
							</button>
						</Tooltip>
					{/each}
				</div>
			</div>

			<!-- Fee Breakdown -->
			{#if isValidAmount}
				<div class="rounded-lg p-4 mb-6">
					<h3 class="font-medium mb-2">Payment Breakdown</h3>
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span>Support amount:</span>

							<span class="font-medium"
								>{selectedPaymentMethod === 'xaman'
									? `XRP ${netAmountXRP.toFixed(6)}`
									: `$${netAmount.toFixed(2)}`}</span
							>
						</div>
						<div class="flex justify-between">
							<span>Platform fee ({feeRate * 100}%):</span>
							<span class="font-medium"
								>{selectedPaymentMethod === 'xaman'
									? `XRP ${platformFeeXRP.toFixed(6)}`
									: `$${platformFee.toFixed(2)}`}</span
							>
						</div>
						<div class="border-t border-gray-200 pt-1 mt-2">
							<div class="flex justify-between font-semibold">
								<span>Total:</span>
								<span
									>{selectedPaymentMethod === 'xaman'
										? `XRP ${totalAmountXRP.toFixed(6)}`
										: `$${totalAmount.toFixed(2)}`}</span
								>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Submit Button -->
			<button
				on:click={handleSubmit}
				disabled={!canSubmit}
				class="button w-full py-4 px-6 rounded-lg font-semiboldtransition-all duration-200
					{canSubmit
					? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
					: 'cursor-not-allowed text-error-400'}"
			>
				{#if isProcessing}
					<div class="flex items-center justify-center">
						<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
						Processing...
					</div>
				{:else if !isValidAmount}
					Select an amount to continue
				{:else if !selectedPaymentMethod}
					Choose a payment method
				{:else}
					Support with ${totalAmount.toFixed(2)}
				{/if}
			</button>

			<!-- Security Notice -->
			<p class="text-xs text-center mt-4">
				🔒 Your payment information is secure and encrypted. We never store your payment details.
			</p>
		</div>
	</div>
</Section>
