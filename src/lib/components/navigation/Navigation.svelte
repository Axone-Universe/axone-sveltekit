<script lang="ts">
	import { drawerStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';


	

	let currentPlace = $page.params;

	function drawerClose(): void {
		drawerStore.close();
		currentPlace = currentPlace;
	}
	

</script>

<nav class="list-nav p-4">
	<div>
	
		<a href={`../${currentPlace.id}/books`} on:click={drawerClose} >Books</a>
		<a href={`../${currentPlace.id}/chapters`} on:click={drawerClose}>Chapters</a>
		<a href={`../${currentPlace.id}/storylines`} on:click={drawerClose}>Storylines</a>
	</div>
	
</nav>
