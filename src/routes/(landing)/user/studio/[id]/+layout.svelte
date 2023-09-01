<script lang="ts">
	import { page } from '$app/stores';

	// Skeleton Features
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import { Drawer, drawerStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent, DrawerSettings } from '@skeletonlabs/skeleton';
	// Local Features
	import Navigation from '$lib/components/navigation/Navigation.svelte';

	// Stylesheets
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	//import '../app.postcss';
	const drawerSettings: DrawerSettings = {
		//id: 'leftDrawer',
		//bgDrawer: 'bg-transparent',
		height: 'h-full',
		padding: 'p-4',
		rounded: 'rounded-xl',
		width: 'w-64',
	};
	function drawerOpen(): void {
		drawerStore.open(drawerSettings);
	}

	// Reactive Properties
	$: classesSidebarLeft = $page.url.pathname === '/' ? 'w-0' : 'w-0 lg:w-64';
</script>



<Drawer>
	<h2 class="p-4">Navigation</h2>
	<hr />
	<Navigation />
</Drawer>


<!-- App Shell -->
<AppShell slotSidebarLeft="bg-surface-500/5 {classesSidebarLeft}">
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<div class="flex items-center">
					
					<strong class="text-4xl ">Studio</strong>
				</div>
			</svelte:fragment>
			
		</AppBar>
	</svelte:fragment>
	<!-- Left Sidebar Slot -->
	<svelte:fragment slot="sidebarLeft">
		<Navigation />
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>