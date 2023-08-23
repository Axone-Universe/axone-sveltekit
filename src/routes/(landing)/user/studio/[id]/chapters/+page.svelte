

<script lang="ts">
	import { tableMapperValues } from '@skeletonlabs/skeleton';
	import { trpc } from '$lib/trpc/client';
	import { Table } from '@skeletonlabs/skeleton';
	import type { TableSource } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { onMount } from 'svelte';
	import { beforeUpdate } from 'svelte';
	import { decodeTime, ulid } from 'ulid';
	import type { BookProperties } from '$lib/shared/book';
	import Icon from 'svelte-awesome';
	import type { ModalSettings, ModalComponent, DrawerSettings } from '@skeletonlabs/skeleton';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import ChapterNotesModal from '$lib/components/chapter/ChapterNotesModal.svelte';
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


	beforeUpdate(() => {
		let chapterID = $page.url.searchParams.get('chapterID');

		
		if (!selectedChapterNode) {
			if (!chapterID && Object.keys(UserChapters).length !== 0) {
				chapterID = Object.keys(UserChapters)[0];
			}

			if (chapterID && chapterID in UserChapters) {
				selectedChapterNode = UserChapters[chapterID];
			}

			
		}
	});


	let selectedChapterNode: HydratedDocument<ChapterProperties>;

	function chapterSelected(chapter: HydratedDocument<ChapterProperties>) {
		selectedChapterNode = UserChapters[chapter._id];
	}


	let modalComponent: ModalComponent = {
		ref: undefined
	};

	let modalSettings: ModalSettings = {
		type: 'component',
		// Pass the component directly:
		component: modalComponent,
		response: (chapterNode: HydratedDocument<ChapterProperties>) => {
			if (!chapterNode) {
				return;
			}

			// Update the UI
			let chapterID = chapterNode._id;
			

			// afterUpdate() will run the setup editor
			UserChapters[chapterID] = chapterNode;

			selectedChapterNode = chapterNode;
			UserChapters = UserChapters;
		}
	};


	let showChapterDetails = (bookID: string, chapId: string) => {
		const foundChapter = UserChapters.find((chapter) => chapter._id === chapId);
		modalComponent.ref = ChapterDetailsModal;
		modalComponent.props = {
			chapterNode: foundChapter,
			bookID: bookID,
			//storylineID: storylineResponse._id
		};

		modalStore.trigger(modalSettings);
	};
/*




NOTES FOR BEN:
Try and see if you can fix the selectedChapterNode selector thing...
Currently I have hacked my own fix
need to test if it works for delete



















*/
	
	let currentPlace = $page.params
	
	let deleteChapter = (chapId: string) => {
		const foundChapter = UserChapters.find((chapter) => chapter._id === chapId);
		const modal: ModalSettings = {
			type: 'confirm',
			// Data
			title: foundChapter.title,
			body: 'Are you sure you wish to delete this chapter?',
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r) {
					trpc($page)
						.chapters.delete.mutate({
							id: foundChapter._id
						})
						.then((response) => {
							if (response.deletedCount !== 0) {
								let deletedID = foundChapter._id;
								let chapterIDs = Object.keys(UserChapters);
								let nextIndex = chapterIDs.indexOf(deletedID) + 1;

								if (nextIndex >= chapterIDs.length) {
									nextIndex = 0;
								}

								let selectedChapterID = chapterIDs[nextIndex];
								

								// delete the node first
								delete UserChapters[deletedID];

								// give next node if it's available
								selectedChapterNode = UserChapters[selectedChapterID];

								UserChapters = UserChapters;

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
	
	

	export let data: PageData;
	$: ({ session, UserChapters} = data);

function pronter(){
	console.log(typeof(UserChapters[0]))
}
	
	</script>

<div class="container p-10 space-y-4">
	<h1>CHAPTERS</h1>
	
	<body>
		<div class="container">
			<div class="row">

				<div class="twelve columns">
					<table class="table">
						<thead>
							<tr>
								
								<th>Book</th>
								<th>Chapter Title</th>

								<th>Description</th>
								<th>Date</th>
								
							
							</tr>
						</thead>

						<tbody>
							{#each UserChapters as chapter}
							{#if selectedChapterNode}
							<button
								on:click={() => {showChapterDetails(chapter.book._id, chapter._id); chapterSelected(chapter); console.log({selectedChapterNode})}}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token"
							>
								<Icon class="p-2" data={edit} scale={2.5} />
							</button>
							<button
										on:click={() => deleteChapter(chapter._id)}
											type="button"
											class="m-2 btn-icon bg-surface-200-700-token">
											<Icon class="p-2" data={trash} scale={2.5} />
									</button>
							{/if}
								<tr>
									<td class="w-1/4">
									<div class="flex items-center">
										
										{#if chapter.book?.imageURL}
       										 <img src={chapter.book?.imageURL} alt="Book Cover" class="w-20 h-20 " />
   										{/if}
										{#if chapter.book == null}
											<h3 class="w-20 h-20 mr-2 p-1">place holder</h3>
										{/if}
										{#if chapter.book}
       										 {chapter.book.title}
   										{/if}
										{#if chapter.book == null}
										{chapter.book}
										{/if}
										
									</div>
									</td>
									<td class="w-1/4">{chapter.title}</td>
									<td class="w-1/4">{chapter.description}</td>
									<td class="w-1/4">{new Date(decodeTime(chapter._id))}</td>
									
								</tr>
								
							{/each}

						</tbody>
					</table>
				</div>

			</div>

		</div>
		
	</body>
</div>