<script lang="ts">
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import type { EditorMenuItem, EditorMode } from '$lib/util/types';
	import Tooltip from '$lib/components/Tooltip.svelte';
	export let menuItems: EditorMenuItem[] = [];
	export let mode: EditorMode;

	let customClass = '';
	export { customClass as class };
</script>

<div class={`${customClass}`}>
	{#each menuItems as menuItem}
		{#if !menuItem.hidden && (!menuItem.mode || menuItem.mode === mode)}
			<Tooltip
				on:click={menuItem.callback}
				fixed={true}
				content={menuItem.label}
				target={menuItem.id}
				placement="left"
			>
				<button
					id={menuItem.id}
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
			</Tooltip>
		{/if}
	{/each}
</div>
