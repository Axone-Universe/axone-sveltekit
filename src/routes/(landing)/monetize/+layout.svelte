<script lang="ts">
	import { page } from '$app/stores';
	import DrawerButton from '$lib/components/studio/DrawerButton.svelte';
</script>

<div class="flex w-full p-2 gap-2">
	<div
		class="min-h-screen rounded-lg sticky top-16 hidden sm:flex flex-col w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-4 gap-2"
	>
		<a
			class="btn {$page.url.pathname === '/monetize/earnings'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/monetize/earnings"
		>
			Earnings
		</a>
		<a
			class="btn {$page.url.pathname === '/monetize/payments'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/monetize/payments"
		>
			Payments
		</a>
	</div>
	<DrawerButton showLabel={false} />
	<slot />
</div>
