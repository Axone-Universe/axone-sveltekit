<script lang="ts">
	import { AppShell, Drawer, drawerStore } from '@skeletonlabs/skeleton';
	import type { DrawerSettings } from '@skeletonlabs/skeleton';

	import Icon from 'svelte-awesome';
	import { chevronLeft, chevronRight } from 'svelte-awesome/icons';

	let customClass = '';
	export { customClass as class };

	export let settings: DrawerSettings;

	function toggleLeftDrawer() {
		if ($drawerStore.open) {
			drawerStore.open(settings);
		} else {
			drawerStore.close();
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div>
	<Drawer class={`${customClass}`}>
		<slot />
	</Drawer>
	<div on:click={toggleLeftDrawer} class="flex h-full items-center hover:variant-soft">
		<Icon class="flex p-2 justify-start" data={chevronLeft} scale={3} />
	</div>
</div>
