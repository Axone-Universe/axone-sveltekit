<script lang="ts">
	import { page } from '$app/stores';
	import { type DrawerSettings } from '@skeletonlabs/skeleton-svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { arrowRight } from 'svelte-awesome/icons';

	export let showLabel = true;

	const drawerStore = getDrawerStore();

	$: category = $page.url.pathname.split('/');

	function handleDrawerButton() {
		const drawerSettings: DrawerSettings = {
			id: 'studio',
			width: 'w-64'
		};

		drawerStore.open(drawerSettings);
	}
</script>

<div class="fixed top-[5.2rem] left-4 flex sm:hidden items-center gap-2 z-100">
	<button class="btn-icon btn-icon-sm preset-filled" onclick="{handleDrawerButton}">
		<Icon data="{arrowRight}" />
	</button>
	{#if showLabel}
		<p class="text-sm capitalize">{category[category.length - 1]}</p>
	{/if}
</div>
