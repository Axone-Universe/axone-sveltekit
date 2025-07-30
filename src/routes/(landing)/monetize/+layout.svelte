<script lang="ts">
	import { page } from '$app/stores';
	import DrawerButton from '$lib/components/studio/DrawerButton.svelte';
	import { PiggyBank, LucideCreditCard, WalletIcon } from 'lucide-svelte';
</script>

<div class="flex w-full p-2 gap-2">
	<div
		class="min-h-screen rounded-lg sticky top-16 hidden sm:flex flex-col w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-4 gap-2"
	>
		<a
			class="btn justify-between px-12 {$page.url.pathname === '/monetize/earnings'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/monetize/earnings"
		>
			<WalletIcon size={20} />
			Earnings
		</a>
		<a
			class="btn justify-between px-12 {$page.url.pathname === '/monetize/payments'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/monetize/payments"
		>
			<LucideCreditCard size={20} />
			Payments
		</a>
	</div>
	<DrawerButton showLabel={false} />
	<slot />
</div>
