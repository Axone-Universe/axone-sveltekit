

<script lang="ts">
	import { tableMapperValues } from '@skeletonlabs/skeleton';
	import { Table } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { onMount } from 'svelte';
	import { beforeUpdate } from 'svelte';
	import { decodeTime, ulid } from 'ulid';




	
	let currentPlace = $page.params
	
	
	

	export let data: PageData;
	$: ({ session, UserChapters} = data);


	//function BookCounter(){
	//	numBooks = UserBooks.length;
	//}
	

	type chapterItem = {
	position: number;
  	Book: string;
  	Date: Date
	};



	let sourceData: Array<chapterItem> = [];
	//const reactiveSourceData = reactive(sourceData);
	function setup(){

	//UserChapters[0].ulid.date
	for (let i = 0; i < UserChapters.length; i++) {

		const chaptertoAdd = ({
		position: i,
		Book: UserChapters[i].book,
		Date: new Date(decodeTime(UserChapters[i]._id))
		});
	
		sourceData.push(chaptertoAdd);
	}
	console.log(sourceData.length);
	sourceData = sourceData;
    }
	
	//beforeUpdate(() => {
    //console.log('the component is about to update');
    //});
	onMount(() => {
		setup();
	});



	//});
	//BookCounter();
	function printer(){
		console.log(UserChapters.length);
	}
	//let numBooks = UserBooks.length;
	
	
	function PRONTER(){
	console.log(sourceData.length);
	
	for (let i = 0; i < sourceData.length; i++) {
	console.log(sourceData[i])
	
	}
	}
	console.log("TESTING" + sourceData.length)
	console.log("THis is being called")


	
	$: tableSimple = {
	// A list of heading labels.
	head: ['Book', 'Description', 'Date'],
	// The data visibly shown in your table body UI.
	body: tableMapperValues(sourceData, ['Book', 'Description', 'Date']),
	// Optional: The data returned when interactive is enabled and a row is clicked.
	meta: tableMapperValues(sourceData, ['position', 'Book', 'Description', 'Date']),
	
	};
	

	</script>

<div class="container p-10 space-y-4">
	<h1>CHAPTERS</h1>
	
	<Table source={tableSimple} />
</div>