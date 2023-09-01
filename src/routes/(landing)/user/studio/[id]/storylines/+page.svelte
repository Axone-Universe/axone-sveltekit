

<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { decodeTime } from 'ulid';
	import Icon from 'svelte-awesome';
	import type { ModalSettings, ModalComponent } from '@skeletonlabs/skeleton';
	import StorylineDetailsModal from '$lib/components/storyline/StorylineDetailsModal.svelte';
	import {
		
		modalStore
	} from '@skeletonlabs/skeleton';
	
	import type {  StorylineProperties } from '$lib/shared/storyline';
	
	import {
	
		trash,
		edit,
		
	} from 'svelte-awesome/icons';



	export let data: PageData;
	$: ({  UserStorylines} = data);


	let modalComponent: ModalComponent = {
		ref: undefined
	};

	let modalSettings: ModalSettings = {
		type: 'component',
		// Pass the component directly:
		component: modalComponent,
		response: (storylineNode: HydratedDocument<StorylineProperties>) => {
			if (!storylineNode) {
				return;
			}

			
			let chapterID = storylineNode._id;
			

			
			UserStorylines[chapterID] = storylineNode;

			
			UserStorylines = UserStorylines;
		}
	};


	let showChapterDetails = (storyline: HydratedDocument<StorylineProperties>) => {
		
		modalComponent.ref = StorylineDetailsModal;
		modalComponent.props = {
			storylineNode: storyline,
			
		};

		modalStore.trigger(modalSettings);
	};

	
	let deleteStoryline = (storyline: HydratedDocument<StorylineProperties>) => {
	
		const modal: ModalSettings = {
			type: 'confirm',
			// Data
			title: storyline.title,
			body: 'Are you sure you wish to delete this chapter?',
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r) {
					trpc($page)
						.storylines.delete.mutate({
							id: storyline._id
						})
						.then((response) => {
							if (response.deletedCount !== 0) {
								let deletedID = storyline._id;
								let storylineIDs = Object.keys(UserStorylines);
								let nextIndex = storylineIDs.indexOf(deletedID) + 1;

								if (nextIndex >= storylineIDs.length) {
									nextIndex = 0;
								}

							
								
								UserStorylines = UserStorylines.filter(storyline => storyline._id !== deletedID);
								UserStorylines = UserStorylines;
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
	
	


	
	</script>

<div class="container p-10 space-y-4">
	<h1>STORYLINES</h1>
	
	<body>
		<div class="container">
			<div class="row">

				<div class="relative overflow-x-auto">
					<table class="table">
						<thead class="uppercase text-xl">
							<tr>
								
								<th>Book</th>
								<th>Storyline Title</th>

								<th>Description</th>
								<th>Date</th>
								<th>Chapters</th>
								
							
							</tr>
						</thead>

						<tbody>
							{#each UserStorylines as storyline}
							
							<button
								on:click={() => showChapterDetails(storyline)}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token"
							>
								<Icon class="p-2" data={edit} scale={2.5} />
							</button>
							<button
										on:click={() => deleteStoryline(storyline)}
											type="button"
											class="m-2 btn-icon bg-surface-200-700-token">
											<Icon class="p-2" data={trash} scale={2.5} />
									</button>
							
								<tr>
									<td class="w-1/5">
									<div class="flex items-center">
										
										{#if storyline.book?.imageURL}
       										 <img src={storyline.book?.imageURL} alt="Book Cover" class="w-20 h-20  mr-2  p-1" />
   										{/if}
										{#if storyline.book == null}
											<h3 class="w-20 h-20 mr-2 p-1">place holder</h3>
										{/if}
										{#if storyline.book}
       										 {storyline.book.title}
   										{/if}
										{#if storyline.book == null}
										{storyline.book}
										{/if}
										
									</div>
									</td>
									<td class="w-1/5">{storyline.title}</td>
									<td class="w-1/5">{storyline.description}</td>
									<td class="w-1/5">{new Date(decodeTime(storyline._id))}</td>
									<td class="w-1/5">{(storyline.chapters).length}</td>
									
								</tr>
								
							{/each}

						</tbody>
					</table>
				</div>

			</div>

		</div>
		
	</body>
</div>