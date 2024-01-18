<script lang="ts">
	import { popup } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';

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
<div
	on:click
	class="cursor-pointer w-fit h-fit [&>*]:pointer-events-none"
	use:popup={popupSettings}
>
	<slot />
	<div class="{fixed ? 'fixed' : ''} card p-2 variant-filled-primary" data-popup={target}>
		<p class="text-secondary-900-50-token">{content}</p>
		<div class="arrow bg-surface-100-800-token" />
	</div>
</div>
