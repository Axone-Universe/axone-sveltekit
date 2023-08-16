

<script lang="ts">
	import { tableMapperValues } from '@skeletonlabs/skeleton';
	import { Table } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { onMount } from 'svelte';




	
	let currentPlace = $page.params
	
	
	let numBooks = 0;

	export let data: PageData;
	$: ({ session, UserBooks } = data);


	function BookCounter(){
		numBooks = UserBooks.length;
	}
	

	type bookItem = {
	position: number;
  	Book: string;
  	description: string;
  	date: Date;
  	storylines: number;
	};
	const sourceData: Array<bookItem> = [];

	for (let i = 0; i < numBooks; i++) {

	const bookToAdd = ({
	position: i,
	Book: UserBooks[i].title,
	description: UserBooks[i].description,
	date: UserBooks[i].date,
	storylines: UserBooks[i].storylines
	});
	//const bookToAdd = {position: i, Book: UserBooks[i].title, Description: UserBooks[i].description, Date: UserBooks[i].date, Storylines: UserBooks[i].storylines }
	//console.log(UserBooks[i].title)
	//console.log(bookToAdd)
	sourceData.push(bookToAdd);
	}
	

	onMount(() => {
	BookCounter();



	});
	//BookCounter();
	function printer(){
		console.log(numBooks);
	}
	//let numBooks = UserBooks.length;
	
	
	function PRONTER(){
	for (let i = 0; i < sourceData.length; i++) {
	//const bookToAdd = {position: i, Book: UserBooks[i].title, Description: UserBooks[i].description, Date: UserBooks[i].date, Storylines: UserBooks[i].storylines }
	//console.log(UserBooks[i].title)
	console.log(sourceData[i])
	
	}
	}

	//const tableSimple: TableSource = {
	// A list of heading labels.
	//head: ['Book', 'Description', 'Date', 'Storylines'],
	// The data visibly shown in your table body UI.
	//body: tableMapperValues(sourceData, ['Book', 'Description', 'Date', 'Storylines']),
	// Optional: The data returned when interactive is enabled and a row is clicked.
	//meta: tableMapperValues(sourceData, ['position', 'Book', 'Description', 'Date', 'Storylines']),
	
//};
	

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
		Print  
	</button>

	<button on:click={PRONTER}>
		PRONT  
	</button>
</div>