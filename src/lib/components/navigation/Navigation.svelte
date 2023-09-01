<script lang="ts">
	import { drawerStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';


	

	let currentPlace = $page.params;
	$:activeTab = ''; 

	
	

</script>

<nav class="list-nav p-4">
	<div>
	
		<a href={`../${currentPlace.id}/books`} on:click={() => { activeTab = 'books' }} class="{activeTab === 'books' ? 'bg-indigo-950' : ''}" >Books</a>
		<a href={`../${currentPlace.id}/chapters`}  on:click={() => { activeTab = 'chapters' }} class="{activeTab === 'chapters' ? 'bg-indigo-950' : ''}" >Chapters</a>
		<a href={`../${currentPlace.id}/storylines`} on:click={() => { activeTab = 'storylines' }} class="{activeTab === 'storylines' ? 'bg-indigo-950' : ''}">Storylines</a>
	</div>
	
</nav>
