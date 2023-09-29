<script lang="ts">
	import { page } from '$app/stores';
	import {goto} from '$app/navigation';

	// Skeleton Features


	/*<nav class="list-nav p-4">
			<div>
			
				<a href={`../${currentPlace.id}/books`} on:click={() => { activeTab = 'books' }} class="{activeTab === 'books' ? 'bg-indigo-950' : ''}" >Books</a>
				<a href={`../${currentPlace.id}/chapters`}  on:click={() => { activeTab = 'chapters' }} class="{activeTab === 'chapters' ? 'bg-indigo-950' : ''}" >Chapters</a>
				<a href={`../${currentPlace.id}/storylines`} on:click={() => { activeTab = 'storylines' }} class="{activeTab === 'storylines' ? 'bg-indigo-950' : ''}">Storylines</a>
			</div>
			
		</nav>
		
		*/
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import { Drawer, drawerStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent, DrawerSettings } from '@skeletonlabs/skeleton';
	// Local Features


	// Stylesheets
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	import '@skeletonlabs/skeleton/styles/all.css';

	import {
		
		ListBox,
		ListBoxItem
		
	} from '@skeletonlabs/skeleton';


	

	let currentPlace = $page.params;
	$:activeTab = 'books'; 

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


	function goToBooks(){
		activeTab = 'books';
		goto(`../${currentPlace.id}/books`);
	}
	function goToChapters(){
		activeTab = 'chapters';
		goto(`../${currentPlace.id}/chapters`);
	}
	function goToStorylines(){
		activeTab = 'storylines';
		goto(`../${currentPlace.id}/storylines`);
	}
</script>





<!-- App Shell -->
<AppShell slotSidebarLeft=" {classesSidebarLeft}" class="flex flex-col h-full">
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
		<nav class="list-nav p-4 flex flex-col h-full" >
			<div class="border-r border-gray-300 pr-4 h-full flex flex-col">
				<ListBox class="flex flex-col h-full" >
					<ListBoxItem name="{activeTab === 'books' ? '' : 'medium'}" on:click={() => { console.log(activeTab) ; goToBooks()}} class="{activeTab === 'books' ? 'bg-indigo-950' : 'soft-listbox'}" value="{activeTab === 'books' ? '' : 'book'}">
						Books
					</ListBoxItem >
			
					<ListBoxItem name="{activeTab === 'chapters' ? '' : 'medium'}" on:click={() => { console.log(activeTab) ; goToChapters()}} class="{activeTab === 'chapters' ? 'bg-indigo-950' : 'soft-listbox'}" value="{activeTab === 'chapters' ? '' : 'book'}">
						Chapters
					</ListBoxItem >
					
					<ListBoxItem name="{activeTab === 'storylines' ? '' : 'medium'}" on:click={() => {  console.log(activeTab) ; goToStorylines()}} class="{activeTab === 'storylines' ? 'bg-indigo-950' : 'soft-listbox'}" value="{activeTab === 'storylines' ? '' : 'book'}">
						Storylines
					</ListBoxItem>	
				</ListBox>
		</div>
	</nav>
		

	
		













		





	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>