<script lang="ts">
	import { drawerStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';

	

	let currentPlace = $page.params
	function drawerClose(): void {
		drawerStore.close();
	}
</script>

<nav class="list-nav p-4">
	<div>
       
		<a href={`../${currentPlace}/books`} on:click={drawerClose} >Books</a>
		<a href={`../${currentPlace}/chapters`} on:click={drawerClose}>Chapters</a>
		<a href={`../${currentPlace}/storylines`} on:click={drawerClose}>Storylines</a>
	</div>
	
</nav>