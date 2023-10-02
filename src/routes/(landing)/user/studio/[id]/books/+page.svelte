

<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { decodeTime,  } from 'ulid';
	import Icon from 'svelte-awesome';
	import type { ModalSettings, ModalComponent, DrawerSettings } from '@skeletonlabs/skeleton';
	import type { BookProperties } from '$lib/properties/book';
	import { trpc } from '$lib/trpc/client';
	import {
		
		modalStore
	} from '@skeletonlabs/skeleton';
	
	import { onMount } from 'svelte';
  	import { writable } from 'svelte/store';
	
	import {
		
		trash,
		edit,
		bars,
				
	} from 'svelte-awesome/icons';
	
	import BookDetailsModal from '$lib/components/book/BookDetailsModal.svelte';

	export let data: PageData;
	$: ({  UserBooks} = data);

	

	UserBooks = UserBooks;
	
	

	let modalComponent: ModalComponent = {
		ref: undefined
	};
	let modalSettings: ModalSettings = {
		type: 'component',
		
		component: modalComponent,
		response: (bookData: HydratedDocument<BookProperties>) => {
			if (!bookData) {
				return;
			}

			// Update the UI
			let bookID = bookData._id;
			

			// afterUpdate() will run the setup editor
			UserBooks[bookID] = bookData;

			
			UserBooks = UserBooks;
		}
		
	};

	let showBookDetails = (book: HydratedDocument<BookProperties>) => {
		
		modalComponent.ref = BookDetailsModal;
		modalComponent.props = {
			bookData: book,
			
		};

		modalStore.trigger(modalSettings);
	};

	
	
	let deleteBook = (book: HydratedDocument<BookProperties>, index:number) => {
		
		const modal: ModalSettings = {
			type: 'confirm',
			// Data
			title: book.title,
			body: 'Are you sure you wish to delete this chapter?',
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r) {
					trpc($page)
						.books.delete.mutate({
							id: book._id
						})
						.then((response) => {
							if (response.deletedCount !== 0) {
								let deletedID = book._id;
								let bookIDs = Object.keys(UserBooks);
								let nextIndex = bookIDs.indexOf(deletedID) + 1;

								if (nextIndex >= bookIDs.length) {
									nextIndex = 0;
								}

							
								
								UserBooks = UserBooks.filter(book => book._id !== deletedID);
								showDropdownButton.splice(index, 1);
							
								
							}
						})
						.catch((error) => {
							console.log(error);
						});
				}
			}
		};
		modalStore.trigger(modal);
		UserBooks = UserBooks;
	};


	let showDropdownButton = Array(0).fill(false);
	onMount(() => {
		
	showDropdownButton = Array(UserBooks.length).fill(false);
	});


	function toggleDropdownButton(index) {
		showDropdownButton[index] = !showDropdownButton[index];
	}

	



	</script>


<style>
	
	.dropdown {
	  position: relative;
	  display: inline-block;
	  
	}
  
	
	.dropdown-content-visible {
	  display: block;
	  position: absolute;
	  z-index: 1;
  	  border: 1px solid #112241;   
  	  padding: 10px; 
      border-radius: 20%;
	  max-height: 220%;   
	  max-width:110%;     
 
	}
  
	
	.dropdown-content-hidden {
	  display: none;
	}

	
  </style>



<div class="container p-10 space-y-4  ">
	<strong class="text-2xl ">BOOKS</strong>
	<body>
		<div class="container">
			<div class="row">

				<div  class="relative overflow-x-auto">
					
					<table class="table">
						<thead class="uppercase text-xl">
							<tr>
								<th>Book</th>

								<th>Description</th>
								<th>Date</th>
								<th>Storylines</th>
								
							
							</tr>
						</thead>

						<tbody class="h-40vh">
							{#each UserBooks as book, index}
							<div class="dropdown">
								<button on:click={() => { toggleDropdownButton(index)}}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token">
								
								<Icon class="p-2" data={bars} scale={2.5} />
								</button>
							
						<div class="{ showDropdownButton[index] ? 'dropdown-content dropdown-content-visible bg-surface-100-800-token' : 'dropdown-content dropdown-content-hidden '}">
						  <div class="flex flex-col justify-center items-center">
							<button
								on:click={() => {  showBookDetails(book)}}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token"
							>
								<Icon class="p-2" data={edit} scale={2.5} />
							</button>
							<button
							on:click={() => deleteBook(book, index)}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token">
								<Icon class="p-2" data={trash} scale={2.5} />
						</button>
						</div>
					</div>
				</div>




								<tr>
									<td class="w-1/4">
									<div class="flex items-center">
										<img src={book.imageURL} alt="Book Cover" class="w-20 h-20 mr-2  p-1" />
										{book.title}
									</div>
								</td>
									<td class="w-1/4">{book.description}</td>
									<td class="w-1/4">{new Date(decodeTime(book._id))}</td>
									<td class="w-1/4">{book.count}</td>
								</tr>
							{/each}

							<tr>
								<td colspan="4" class="p-4"></td>
							</tr>

						</tbody>
					</table>
				</div>

			</div>

		</div>
		
	</body>
</div>