<script lang="ts">
	import { Icon } from 'svelte-awesome';
	import type { EditorMenuItem } from '$lib/util/types';

	export let menuItems: EditorMenuItem[] = [];

	let customClass = '';
	export { customClass as class };
</script>

<div class={`${customClass}`}>
	{#each menuItems as menuItem}
		<button
			on:click={menuItem.callback}
			type="button"
			class={`m-2 btn-icon bg-surface-200-700-token ${menuItem.class}`}
		>
			<Icon class="p-2" data={menuItem.icon} scale={2.5} pulse={menuItem.pulse} />
			{#if menuItem.notification}
				<span class="badge-icon z-10 variant-filled absolute -top-1 -right-1"
					>{menuItem.notification}</span
				>
			{/if}
		</button>
	{/each}
</div>
