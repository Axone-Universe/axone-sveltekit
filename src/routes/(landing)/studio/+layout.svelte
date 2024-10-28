<script lang="ts">
	import { page } from '$app/stores';
	import DrawerButton from '$lib/components/studio/DrawerButton.svelte';
</script>

<div class="flex w-full p-2 gap-2">
	<div
		class="min-h-screen rounded-lg sticky top-16 hidden sm:flex flex-col w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-4 gap-2"
	>
		<a
			class="btn {$page.url.searchParams.get('campaigns') === 'true'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/studio/books?campaigns=true"
		>
			Campaigns
		</a>
		<a
			class="btn {$page.url.pathname === '/studio/books' &&
			$page.url.searchParams.get('campaigns') !== 'true'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/studio/books"
		>
			Books
		</a>
		<a
			class="btn {$page.url.pathname === '/studio/storylines'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/studio/storylines"
		>
			Storylines
		</a>
		<a
			class="btn {$page.url.pathname === '/studio/chapters'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/studio/chapters"
		>
			Chapters
		</a>
	</div>
	<DrawerButton showLabel={false} />
	<slot />
</div>
