<script lang="ts">
	import { page } from '$app/stores';
	import {goto} from '$app/navigation';
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import { Drawer, drawerStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent, DrawerSettings } from '@skeletonlabs/skeleton';
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import {
		
		ListBox,
		ListBoxItem
		
	} from '@skeletonlabs/skeleton';

	let currentPlace = $page.params;
	
	let studioNavList = 'book';

	
	const drawerSettings: DrawerSettings = {
	
		height: 'h-full',
		padding: 'p-4',
		rounded: 'rounded-xl',
		width: 'w-64',
	};
	function drawerOpen(): void {
		drawerStore.open(drawerSettings);
	}

	
	$: classesSidebarLeft = $page.url.pathname === '/' ? 'w-0' : 'w-0 lg:w-64';


	function goToBooks(){
		
		goto(`../${currentPlace.id}/books`);
	}
	function goToChapters(){
		
		goto(`../${currentPlace.id}/chapters`);
	}
	function goToStorylines(){
		
		goto(`../${currentPlace.id}/storylines`);
	}
</script>


<AppShell slotSidebarLeft=" {classesSidebarLeft}" class="flex flex-col h-full !bg-transparent">
	

	<svelte:fragment slot="sidebarLeft">
		<nav class="list-nav p-4 flex flex-col h-full" >
			
			<div class="border-r border-gray-300 pr-4 h-full flex flex-col">
				<strong class="text-2xl pb-4">Studio</strong>
				<ListBox class="flex flex-col h-full" >
					<ListBoxItem bind:group={studioNavList} name='medium' on:click={() => { goToBooks()}} class='soft-listbox' value='book'>
						Books
					</ListBoxItem >
			
					<ListBoxItem bind:group={studioNavList} name='medium' on:click={() => {  goToChapters()}} class= 'soft-listbox'value='chapter'>
						Chapters
					</ListBoxItem >
					
					<ListBoxItem bind:group={studioNavList} name='medium' on:click={() => { goToStorylines()}} class='soft-listbox' value='storyline'>
						Storylines
					</ListBoxItem>	
				</ListBox>
		</div>
	</nav>
		

	
		













		





	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>