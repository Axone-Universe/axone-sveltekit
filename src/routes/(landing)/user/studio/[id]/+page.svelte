<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	let currentPlace = $page.params
	
	
	
	export let data: PageData;
	$: ({ session, UserBooks } = data);

	function printer(){
		console.log(UserBooks);
	}
	

	</script>

<div class="container p-10 space-y-4">
	<button on:click={printer}>
		Clicked  
	</button>
	<h1>Author Studio</h1>
	<hr />
	<p>
		The homepage has been setup so no sidebar navigation is visible on desktop screens. However if you resize or view on smaller mobile size
		devices, a hamburger menu will appear, allowing you to access the standard navigation.
	</p>
	
	
</div>