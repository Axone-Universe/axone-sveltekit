<script lang="ts">
	import { page } from '$app/stores';
	import { type AccountProperties } from '$lib/properties/account';
	import { trpc } from '$lib/trpc/client';
	import { type HydratedDocument } from 'mongoose';
	import { onMount, onDestroy } from 'svelte';
	import { isValidClassicAddress, isValidXAddress } from 'xrpl';
	import {
		arrowLeft,
		creditCardAlt,
		exclamationCircle,
		checkCircle,
		externalLink,
		copy
	} from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import Section from '../Section.svelte';

	/** props */
	export let account: HydratedDocument<AccountProperties>;

	let customClass = '';
	export { customClass as class };

	/** state management */
	$: xrpAddress = '';
	$: destinationTag = 0;
	$: withdrawalAmount = '';
	$: isProcessing = false;
	$: showSuccessModal = false;
	$: addressError = '';
	$: amountError = '';
	$: usdToXrpRate = 0; // Mock XRP to USD rate

	// Reactive calculations
	$: usdAmount = withdrawalAmount
		? (parseFloat(withdrawalAmount) / usdToXrpRate).toFixed(6)
		: '0.000000';
	$: isValidAddress = validateXRPAddress(xrpAddress);
	$: isValidAmount =
		parseFloat(withdrawalAmount) > 0 && parseFloat(withdrawalAmount) <= (account.balance ?? 0);
	$: canWithdraw = isValidAddress && isValidAmount && !isProcessing;

	/** constants */
	const usdToXrpRateInterval = setInterval(() => {
		getRates();
	}, 10000);

	onMount(() => {
		getRates();
		if ((account.balance ?? 0) > 0) setMaxAmount();
	});

	onDestroy(() => clearInterval(usdToXrpRateInterval));

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

	function validateXRPAddress(address: string) {
		if (!address) return false;

		if (isValidClassicAddress(address)) {
			return true;
		} else if (isValidXAddress(address)) {
			return true;
		}

		return false;
	}

	function handleAddressChange() {
		if (xrpAddress && !isValidAddress) {
			addressError = 'Please enter a valid XRP address';
		} else {
			addressError = '';
		}
	}

	function handleAmountChange() {
		const amount = parseFloat(withdrawalAmount);
		if (withdrawalAmount && (isNaN(amount) || amount <= 0)) {
			amountError = 'Please enter a valid amount';
		} else if (amount > (account.balance ?? 0)) {
			amountError = `Amount exceeds available balance (${(account.balance ?? 0).toFixed(
				account.currencyScale
			)})`;
		} else {
			amountError = '';
		}
	}

	function setMaxAmount() {
		withdrawalAmount = (account.balance ?? 0).toString();
		handleAmountChange();
	}

	async function handleWithdraw() {
		if (!canWithdraw) return;

		isProcessing = true;

		try {
			// Simulate withdrawal processing
			const response = await trpc($page).accounts.withdraw.query({
				id: account._id ?? '',
				receiverAddress: xrpAddress,
				destinationTag: destinationTag
			});

			if (response.success) {
				account = response.data as HydratedDocument<AccountProperties>;
				showSuccessModal = true;
			}

			// Update available balance
			// if (account.balance) account.balance -= parseFloat(withdrawalAmount);
		} catch (error) {
			alert('Withdrawal failed. Please try again.');
			console.log(error);
		} finally {
			isProcessing = false;
		}
	}

	function copyAddress() {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(xrpAddress);
		}
	}
</script>

<Section class="{customClass} min-h-screen py-8 px-4 w-modal">
	<div class="max-w-md mx-auto">
		<!-- Balance Card -->
		<div class="card shadow-lg p-6 mb-6">
			<div class="w-full flex flex-col items-center mb-6">
				<h1 class="text-xl font-semibold ml-3">Withdraw Funds</h1>
			</div>

			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center">
					<Icon class="w-8 h-8 text-primary-600-300-token mr-2" data={creditCardAlt} scale={2} />
					<span class="text-sm font-medium">Available Balance</span>
				</div>
				<div class="text-right">
					<div class="text-2xl font-bold">
						{account.currency}
						{(account.balance ?? 0).toFixed(account.currencyScale)}
					</div>
					<div class="text-sm">
						≈ {((account.balance ?? 0) / usdToXrpRate).toFixed(2)} USD
					</div>
				</div>
			</div>
			<div class=" rounded-lg p-3">
				<div class="flex items-center justify-between text-sm">
					<span>XRP Rate:</span>
					<span class="font-medium">${usdToXrpRate.toFixed(4)} USD</span>
				</div>
			</div>
		</div>

		<!-- Withdrawal Form -->
		{#if showSuccessModal}
			<div class="card shadow-lg p-6 mb-6">
				<div class="rounded-2xl p-8 max-w-sm mx-4 text-center">
					<button
						class="btn-icon w-16 h-16 mx-auto mb-4 bg-success-50-900-token flex items-center justify-center"
					>
						<Icon class="w-8 h-8" data={checkCircle} scale={2} />
					</button>
					<h2 class="text-lg font-semibold text-success-800-100-token mb-2">
						Withdrawal Submitted!
					</h2>
					<p class="mb-4">
						Your withdrawal of <span class="chip text-md variant-soft-primary"
							>{account.balance}</span
						>
						{account.currency}
						has been submitted for processing.
					</p>
					<div class=" rounded-lg p-3 mb-4">
						<div class="text-sm mb-1">To Address:</div>
						<div class="chip variant-soft-primary font-mono text-md break-all">{xrpAddress}</div>
						{#if destinationTag}
							<div class="text-sm mt-2 mb-1">Destination Tag:</div>
							<div class="font-mono text-sm">{destinationTag}</div>
						{/if}
					</div>
					<div class="text-sm">Processing time: 1-24 hours</div>
				</div>
			</div>
		{:else}
			<div class="card shadow-lg p-6 mb-6">
				<fieldset disabled={account.balance === 0}>
					<h2 class="text-lg font-semibold mb-6">Withdraw to XRP Address</h2>

					<!-- XRP Address Field -->
					<div class="mb-6">
						<label for="xrpAddress" class="block text-sm font-medium mb-2"> XRP Address * </label>
						<div class="relative">
							<input
								id="xrpAddress"
								type="text"
								bind:value={xrpAddress}
								on:input={handleAddressChange}
								placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
								class="input w-full px-4 py-2 border-1 focus:outline-none transition-colors pr-10
							{addressError
									? 'border-red-300 focus:border-red-500'
									: isValidAddress
									? 'border-green-300 focus:border-green-500'
									: 'border-gray-200 focus:border-purple-500'}"
							/>
							{#if xrpAddress}
								<button
									on:click={copyAddress}
									class="btn-icon absolute right-1 top-1/2 transform -translate-y-1/2 text-primary-800-100-token border-none !p-1"
								>
									<Icon class="w-5 h-5" data={copy} scale={1.2} />
								</button>
							{/if}
						</div>
						{#if addressError}
							<div class="flex items-center mt-2 text-sm text-error-600-300-token">
								<Icon class="w-5 h-5 mr-2" data={exclamationCircle} scale={1.2} />
								{addressError}
							</div>
						{:else if isValidAddress}
							<div class="flex items-center mt-2 text-sm text-success-800-100-token">
								<Icon class="w-5 h-5 mr-2" data={checkCircle} scale={1.2} />
								Valid XRP address
							</div>
						{/if}
					</div>

					<!-- Destination Tag Field -->
					<div class="mb-6">
						<label for="destinationTag" class="block text-sm font-medium mb-2">
							Destination Tag (Optional)
						</label>
						<input
							id="destinationTag"
							type="number"
							bind:value={destinationTag}
							placeholder="Enter destination tag if required"
							class="input w-full px-4 py-2 border-1 focus:border-purple-500 focus:outline-none transition-colors"
						/>
						<p class="text-xs mt-1">
							Some exchanges require a destination tag. Check with your wallet provider.
						</p>
					</div>

					<!-- Amount Field -->
					<div class="mb-6">
						<label for="amount" class="block text-sm font-medium mb-2">
							Withdrawal Amount ({account.currency}) *
						</label>
						<div class="relative">
							<span class="absolute left-3 top-1/2 transform -translate-y-1/2 font-medium"
								>{account.currency}</span
							>
							<input
								disabled
								id="amount"
								type="number"
								bind:value={withdrawalAmount}
								on:input={handleAmountChange}
								placeholder="0.00"
								min="0"
								max={account.balance ?? 0}
								step="0.01"
								class="input w-full pl-12 pr-20 py-2 border-1 focus:outline-none transition-colors
							{amountError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'}"
							/>
							<button
								on:click={setMaxAmount}
								class="chip absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
							>
								MAX
							</button>
						</div>
						{#if amountError}
							<div class="flex items-center mt-2 text-sm text-red-600">
								<Icon class="w-5 h-5 mr-2" data={exclamationCircle} scale={1.2} />
								{amountError}
							</div>
						{/if}
					</div>

					<!-- Conversion Display -->
					{#if withdrawalAmount && isValidAmount}
						<div class="rounded-lg p-4 mb-6">
							<h3 class="font-medium mb-3">You will receive:</h3>
							<div class="space-y-2">
								<div class="flex justify-between items-center">
									<span class="">{account.currency} Amount:</span>
									<span class="font-bold text-lg">{account.balance} {account.currency}</span>
								</div>
								<div class="flex justify-between items-center text-sm">
									<span class="">USD Amount:</span>
									<span class="">≈ {((account.balance ?? 0) / usdToXrpRate).toFixed(2)} USD</span>
								</div>
							</div>
						</div>
					{/if}

					<!-- Submit Button -->
					<button
						on:click={handleWithdraw}
						disabled={!canWithdraw}
						class="w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200
					{canWithdraw
							? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
							: 'cursor-not-allowed'}"
					>
						{#if isProcessing}
							<div class="flex items-center justify-center">
								<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
								Processing Withdrawal...
							</div>
						{:else if !xrpAddress}
							Enter XRP address
						{:else if !isValidAddress}
							Invalid XRP address
						{:else if !withdrawalAmount}
							Enter withdrawal amount
						{:else if !isValidAmount}
							Invalid amount
						{:else}
							Withdraw {usdAmount} XRP
						{/if}
					</button>
				</fieldset>
			</div>
		{/if}

		<!-- Important Notes -->
		<div class="card border p-4">
			<div class="flex items-start">
				<Icon class="w-5 h-5 mr-2" data={exclamationCircle} scale={1.2} />
				<div class="text-sm">
					<h3 class="font-medium mb-2">Important Notes:</h3>
					<ul class="space-y-1">
						<li>Withdrawals are processed within 24 hours</li>
						<li>Double-check your XRP address - transactions cannot be reversed</li>
						<li>Network fees may apply depending on current XRP network conditions</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</Section>
