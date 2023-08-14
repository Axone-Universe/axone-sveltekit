

<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	let currentPlace = $page.params
	
	
	
	export let data: PageData;
	$: ({ session, UserBooks } = data);

	function printer(){
		console.log(UserBooks.length);
	}
	

	</script>

<div class="container p-10 space-y-4">
	<h1>BOOKS</h1>
	<ul>
		//users is array and user is an alias
		{#each UserBooks as book}
		   <li>{book.title}</li>
		   <li>{book.description}</li>
		   <hr />
		{/each}
	
	</ul>
	<hr />
	
	<button on:click={printer}>
		Clicked  
	</button>
</div>