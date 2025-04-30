<script lang="ts">
	import type { PopupSettings } from '@skeletonlabs/skeleton-svelte';

	export let content: string;
	export let placement: 'top' | 'bottom' | 'left' | 'right';
	export let target: string;
	export let fixed: boolean = false;

	const popupSettings: PopupSettings = {
		event: 'hover',
		target: target,
		placement: placement
	};
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div onclick class="cursor-pointer *:pointer-events-none" use:popup="{popupSettings}">
	<slot />
	<div class="{fixed ? 'fixed' : ''} card p-2 preset-filled-primary-500" data-popup="{target}">
		<p class="text-secondary-950-50">{content}</p>
		<div class="arrow bg-surface-100-900"></div>
	</div>
</div>
