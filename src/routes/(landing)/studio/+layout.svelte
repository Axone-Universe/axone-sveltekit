<script lang="ts">
	import { page } from '$app/stores';
	import { Megaphone, Book, Split, BookOpen, PaintBucket, Paintbrush, Bell } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	export let { user } = data;

	$: isAdmin = user?.admin ?? false;

	let isExpanded = false;
	let menuElement: HTMLDivElement;
	let contentElement: HTMLDivElement;
	let startX = 0;
	let currentX = 0;
	let isDragging = false;
	let currentMenuWidth = 64;
	const COLLAPSED_WIDTH = 64; // 16 * 4 = 64px (w-16)
	const EXPANDED_WIDTH = 256; // 16 * 16 = 256px (w-64)

	$: menuWidth = isDragging ? currentMenuWidth : isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

	function handleTouchStart(e: TouchEvent) {
		startX = e.touches[0].clientX;
		isDragging = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging) return;
		currentX = e.touches[0].clientX;
		const deltaX = currentX - startX;

		// Only allow dragging to the right when collapsed, or to the left when expanded
		if (!isExpanded && deltaX > 0) {
			// Dragging right to expand
			currentMenuWidth = Math.min(COLLAPSED_WIDTH + deltaX, EXPANDED_WIDTH);
			if (menuElement) {
				menuElement.style.width = `${currentMenuWidth}px`;
			}
		} else if (isExpanded && deltaX < 0) {
			// Dragging left to collapse
			currentMenuWidth = Math.max(EXPANDED_WIDTH + deltaX, COLLAPSED_WIDTH);
			if (menuElement) {
				menuElement.style.width = `${currentMenuWidth}px`;
			}
		}
	}

	function handleTouchEnd() {
		if (!isDragging) return;
		isDragging = false;

		const deltaX = currentX - startX;
		const threshold = 50; // Minimum drag distance to trigger toggle

		if (!isExpanded && deltaX > threshold) {
			// Expand
			isExpanded = true;
			currentMenuWidth = EXPANDED_WIDTH;
			if (menuElement) {
				menuElement.style.width = `${EXPANDED_WIDTH}px`;
			}
		} else if (isExpanded && deltaX < -threshold) {
			// Collapse
			isExpanded = false;
			currentMenuWidth = COLLAPSED_WIDTH;
			if (menuElement) {
				menuElement.style.width = `${COLLAPSED_WIDTH}px`;
			}
		} else {
			// Snap back to current state
			currentMenuWidth = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;
			if (menuElement) {
				menuElement.style.width = `${currentMenuWidth}px`;
			}
		}
	}

	function toggleMenu() {
		isExpanded = !isExpanded;
		currentMenuWidth = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;
		if (menuElement) {
			menuElement.style.width = `${currentMenuWidth}px`;
		}
	}
</script>

<div class="flex w-full p-2 gap-2">
	<!-- Mobile Expandable Menu -->
	<div
		bind:this={menuElement}
		class="sm:hidden fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-surface-100-800-token border-r border-surface-500/30 pt-4 pb-24 transition-all duration-300 ease-in-out"
		style="width: {COLLAPSED_WIDTH}px;"
		on:touchstart={handleTouchStart}
		on:touchmove={handleTouchMove}
		on:touchend={handleTouchEnd}
	>
		<!-- Drag Handle / Toggle Button -->
		<button
			class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-4 h-16 bg-surface-200-700-token rounded-r-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
			on:click={toggleMenu}
			aria-label={isExpanded ? 'Collapse menu' : 'Expand menu'}
		>
			<div class="w-1 h-8 bg-surface-400-500-token rounded-full" />
		</button>

		<div class="flex-1 flex flex-col gap-3 px-2 overflow-hidden">
			<!-- Campaigns -->
			<a
				class="btn {$page.url.searchParams.get('campaigns') === 'true'
					? 'variant-filled-primary'
					: 'variant-filled'} {isExpanded
					? 'justify-between px-3'
					: 'btn-icon btn-icon-lg rounded-full justify-center'}"
				href="/studio/books?campaigns=true"
				aria-label="Campaigns"
			>
				<Megaphone size={20} />
				{#if isExpanded}
					<span class="ml-2">Campaigns</span>
				{/if}
			</a>

			<!-- Books -->
			<a
				class="btn {$page.url.pathname === '/studio/books' &&
				$page.url.searchParams.get('campaigns') !== 'true'
					? 'variant-filled-primary'
					: 'variant-filled'} {isExpanded
					? 'justify-between px-3'
					: 'btn-icon btn-icon-lg rounded-full justify-center'}"
				href="/studio/books"
				aria-label="Books"
			>
				<Book size={20} />
				{#if isExpanded}
					<span class="ml-2">Books</span>
				{/if}
			</a>

			<!-- Storylines -->
			<a
				class="btn {$page.url.pathname === '/studio/storylines'
					? 'variant-filled-primary'
					: 'variant-filled'} {isExpanded
					? 'justify-between px-3'
					: 'btn-icon btn-icon-lg rounded-full justify-center'}"
				href="/studio/storylines"
				aria-label="Storylines"
			>
				<Split size={20} />
				{#if isExpanded}
					<span class="ml-2">Storylines</span>
				{/if}
			</a>

			<!-- Chapters -->
			<a
				class="btn {$page.url.pathname === '/studio/chapters'
					? 'variant-filled-primary'
					: 'variant-filled'} {isExpanded
					? 'justify-between px-3'
					: 'btn-icon btn-icon-lg rounded-full justify-center'}"
				href="/studio/chapters"
				aria-label="Chapters"
			>
				<BookOpen size={20} />
				{#if isExpanded}
					<span class="ml-2">Chapters</span>
				{/if}
			</a>

			<hr class="my-2" />

			<!-- Resources -->
			<a
				class="btn {$page.url.pathname === '/studio/resources'
					? 'variant-filled-primary'
					: 'variant-filled'} {isExpanded
					? 'justify-between px-3'
					: 'btn-icon btn-icon-lg rounded-full justify-center'}"
				href="/studio/resources"
				aria-label="Resources"
			>
				<Paintbrush size={20} />
				{#if isExpanded}
					<span class="ml-2">Resources</span>
				{/if}
			</a>

			<!-- Notifications (Admin only) -->
			{#if isAdmin}
				<a
					class="btn {$page.url.pathname === '/studio/notifications'
						? 'variant-filled-primary'
						: 'variant-filled'} {isExpanded
						? 'justify-between px-3'
						: 'btn-icon btn-icon-lg rounded-full justify-center'}"
					href="/studio/notifications"
					aria-label="Notifications"
				>
					<Bell size={20} />
					{#if isExpanded}
						<span class="ml-2">Notifications</span>
					{/if}
				</a>
			{/if}
		</div>
	</div>

	<!-- Desktop Full Menu -->
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
	<div
		bind:this={contentElement}
		class="sm:ml-0 flex-1 transition-all duration-300"
		style="margin-left: {menuWidth}px;"
	>
		<slot />
	</div>
</div>

<style>
	@media (min-width: 640px) {
		.sm\:ml-0 {
			margin-left: 0 !important;
		}
	}
</style>
