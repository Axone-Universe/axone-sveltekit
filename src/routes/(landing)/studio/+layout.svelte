<script lang="ts">
	import { page } from '$app/stores';
	import DrawerButton from '$lib/components/studio/DrawerButton.svelte';
	import { Megaphone, Book, Split, BookOpen, PaintBucket, Paintbrush, Bell } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	export let { user } = data;

	$: isAdmin = user?.admin ?? false;
</script>

<div class="flex w-full p-2 gap-2">
	<div
		class="min-h-screen rounded-lg sticky top-16 hidden sm:flex flex-col w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-4 gap-2"
	>
		<a
			class="btn justify-between px-12 {$page.url.searchParams.get('campaigns') === 'true'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/studio/books?campaigns=true"
		>
			<Megaphone size={20} />
			Campaigns
		</a>
		<a
			class="btn justify-between px-12 {$page.url.pathname === '/studio/books' &&
			$page.url.searchParams.get('campaigns') !== 'true'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/studio/books"
		>
			<Book size={20} />
			Books
		</a>
		<a
			class="btn justify-between px-12 {$page.url.pathname === '/studio/storylines'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/studio/storylines"
		>
			<Split size={20} />
			Storylines
		</a>
		<a
			class="btn justify-between px-12 {$page.url.pathname === '/studio/chapters'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/studio/chapters"
		>
			<BookOpen size={20} />
			Chapters
		</a>

		<hr class="m-4" />

		<a
			class="btn justify-between px-12 {$page.url.pathname === '/studio/resources'
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/studio/resources"
		>
			<Paintbrush size={20} />
			Resources
		</a>

		{#if isAdmin}
			<a
				class="btn justify-between px-12 {$page.url.pathname === '/studio/notifications'
					? 'variant-filled-primary'
					: 'variant-filled'}"
				href="/studio/notifications"
			>
				<Bell size={20} />
				Notifications
			</a>
		{/if}
	</div>
	<DrawerButton showLabel={false} />
	<slot />
</div>
