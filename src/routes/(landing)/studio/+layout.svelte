<script lang="ts">
	import { page } from '$app/stores';
	import DrawerButton from '$lib/components/studio/DrawerButton.svelte';
</script>

<div class="flex w-full">
	<div
		class="h-screen sticky top-16 hidden sm:flex flex-col w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-2 gap-2 z-10"
	>
		<a
			class="btn {$page.url.pathname === '/studio/books'
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
