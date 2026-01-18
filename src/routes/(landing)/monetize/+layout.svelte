<script lang="ts">
	import { page } from '$app/stores';
	import { LucideCreditCard, WalletIcon } from 'lucide-svelte';

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
			<!-- Earnings -->
			<a
					class="btn {$page.url.pathname.startsWith('/monetize/earnings')
					? 'variant-filled-primary'
					: 'variant-filled'} {isExpanded
					? 'justify-between px-3'
					: 'btn-icon btn-icon-lg rounded-full justify-center'}"
				href="/monetize/earnings"
				aria-label="Earnings"
			>
				<WalletIcon size={20} />
				{#if isExpanded}
					<span class="ml-2">Earnings</span>
				{/if}
			</a>

			<!-- Payments -->
			<a
				class="btn {$page.url.pathname.startsWith('/monetize/payments')
					? 'variant-filled-primary'
					: 'variant-filled'} {isExpanded
					? 'justify-between px-3'
					: 'btn-icon btn-icon-lg rounded-full justify-center'}"
				href="/monetize/payments"
				aria-label="Payments"
			>
				<LucideCreditCard size={20} />
				{#if isExpanded}
					<span class="ml-2">Payments</span>
				{/if}
			</a>
		</div>
	</div>

	<!-- Desktop Full Menu -->
	<div
		class="min-h-screen rounded-lg sticky top-16 hidden sm:flex flex-col w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-4 gap-2"
	>
		<a
			class="btn justify-between px-12 {$page.url.pathname.startsWith('/monetize/earnings')
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/monetize/earnings"
		>
			<WalletIcon size={20} />
			Earnings
		</a>
		<a
				class="btn justify-between px-12 {$page.url.pathname.startsWith('/monetize/payments')
				? 'variant-filled-primary'
				: 'variant-filled'}"
			href="/monetize/payments"
		>
			<LucideCreditCard size={20} />
			Payments
		</a>
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
