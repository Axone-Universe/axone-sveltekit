

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

	
	let currentPlace = $page.params
	
	
	

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
								on:click={() => showChapterDetails(chapter.book._id, chapter._id)}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token"
							>
								<Icon class="p-2" data={edit} scale={2.5} />
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