

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
	import Icon from 'svelte-awesome';
	import type { ModalSettings, ModalComponent, DrawerSettings } from '@skeletonlabs/skeleton';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import ChapterNotesModal from '$lib/components/chapter/ChapterNotesModal.svelte';
	import type { BookProperties } from '$lib/shared/book';
	import { trpc } from '$lib/trpc/client';
	import {
		AppShell,
		Drawer,
		drawerStore,
		Accordion,
		AccordionItem,
		ListBoxItem,
		ListBox,
		LightSwitch,
		modalStore
	} from '@skeletonlabs/skeleton';
	
	import type {  ChapterProperties } from '$lib/shared/chapter';
	
	import {
		
		check,
		trash,
		edit,
		
	} from 'svelte-awesome/icons';
	
	import BookDetailsModal from '$lib/components/book/BookDetailsModal.svelte';

	export let data: PageData;
	$: ({ session, UserBooks} = data);

	
	let currentPlace = $page.params
	UserBooks = UserBooks;
	
	let numBooks = 0;

	let modalComponent: ModalComponent = {
		ref: undefined
	};
	let modalSettings: ModalSettings = {
		type: 'component',
		// Pass the component directly:
		component: modalComponent
		
	};

	let showBookDetails = (book: HydratedDocument<BookProperties>) => {
		//const foundChapter = UserChapters.find((chapter) => chapter._id === chapId);
		modalComponent.ref = BookDetailsModal;
		modalComponent.props = {
			bookData: book,
			
		};

		modalStore.trigger(modalSettings);
	};

	//console.log(UserBooks.length);
	
	let deleteBook = (book: HydratedDocument<BookProperties>) => {
		
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
								// delete the node first
								//delete UserChapters[deletedID];

								// give next node if it's available
								console.log(UserBooks.length);
								
								UserBooks = UserBooks;
								console.log("a second time now");
								console.log(UserBooks.length);
								// setup the editor
								
							}
						})
						.catch((error) => {
							console.log(error);
						});
				}
			}
		};
		modalStore.trigger(modal);
	};



	/*let showModal = () => {
    if (selectedBookNode != null) {
        modalStore.trigger(modal);
    }
};*/


	</script>

<div class="container p-10 space-y-4">
	<h1>BOOKS</h1>
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

						<tbody>
							{#each UserBooks as book}

							
							<button
								on:click={() => {  showBookDetails(book)}}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token"
							>
								<Icon class="p-2" data={edit} scale={2.5} />
							</button>
							<button
							on:click={() => deleteBook(book)}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token">
								<Icon class="p-2" data={trash} scale={2.5} />
						</button>




								<tr>
									<td class="w-1/4">
									<div class="flex items-center">
										<img src={book.imageURL} alt="Book Cover" class="w-20 h-20 mr-2  p-1" />
										{book.title}
									</div>
								</td>
									<td class="w-1/4">{book.description}</td>
									<td class="w-1/4">{new Date(decodeTime(book._id))}</td>
									<td class="w-1/4">{book.storylines}</td>
								</tr>
							{/each}

						</tbody>
					</table>
				</div>

			</div>

		</div>
		
	</body>
</div>