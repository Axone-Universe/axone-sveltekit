<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { decodeTime } from 'ulid';
	import Icon from 'svelte-awesome';
	import type { ModalSettings, ModalComponent } from '@skeletonlabs/skeleton';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import { afterUpdate } from 'svelte';
	import { modalStore } from '@skeletonlabs/skeleton';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import { onMount } from 'svelte';
	import { trash, edit, bars } from 'svelte-awesome/icons';

	export let data: PageData;

	$: ({ UserChapters } = data);

	let modalComponent: ModalComponent = {
		ref: undefined
	};

	let modalSettings: ModalSettings = {
		type: 'component',

		component: modalComponent,
		response: (chapterNode: HydratedDocument<ChapterProperties>) => {
			if (!chapterNode) {
				return;
			}

			let chapterID = chapterNode._id;

			UserChapters[chapterID] = chapterNode;

			UserChapters = UserChapters;
		}
	};

	let showChapterDetails = (bookID: string, chapId: string) => {
		const foundChapter = UserChapters.find((chapter) => chapter._id === chapId);
		modalComponent.ref = ChapterDetailsModal;
		modalComponent.props = {
			chapter: foundChapter,
			bookID: bookID,
			storylineID:
				typeof foundChapter?.storyline === 'string'
					? foundChapter?.storyline
					: foundChapter?.storyline!._id
		};

		modalStore.trigger(modalSettings);
	};

	let deleteChapter = (chapId: string) => {
		const foundChapter = UserChapters.find((chapter) => chapter._id === chapId);
		const modal: ModalSettings = {
			type: 'confirm',

			title: foundChapter.title,
			body: 'Are you sure you wish to delete this chapter?',

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

								UserChapters = UserChapters.filter((chapter) => chapter._id !== deletedID);
							}
						})
						.catch((error) => {
							console.log(error);
						});
				}
			}
		};
		UserChapters = UserChapters;
		modalStore.trigger(modal);
	};
	let showDropdownButton = Array(0).fill(false);
	onMount(() => {
		showDropdownButton = Array(UserChapters.length).fill(false);
	});

	function toggleDropdownButton(index) {
		showDropdownButton[index] = !showDropdownButton[index];
	}
</script>

<div class="container pr-10 pl-10 custom-padding pb-10 space-y-4 pb-4">
	<strong class="text-2xl">Chapters</strong>

	<body>
		<div class="container">
			<div class="row">
				<div class="relative overflow-x-auto min-h-2000">
					<table class="table">
						<thead class="uppercase text-xl">
							<tr>
								<th>Book</th>
								<th>Chapter Title</th>

								<th>Description</th>
								<th>Date</th>
							</tr>
						</thead>

						<tbody class="min-h-2000">
							{#each UserChapters as chapter, index}
								<div class="dropdown">
									<button
										on:click={() => {
											toggleDropdownButton(index);
										}}
										type="button"
										class="m-2 btn-icon bg-surface-200-700-token"
									>
										<Icon class="p-2" data={bars} scale={2.5} />
									</button>
									<div
										class={showDropdownButton[index]
											? 'dropdown-content dropdown-content-visible bg-surface-100-800-token'
											: 'dropdown-content dropdown-content-hidden '}
									>
										<div class="flex flex-col justify-center items-center">
											<button
												on:click={() => showChapterDetails(chapter.book._id, chapter._id)}
												type="button"
												class="m-2 btn-icon bg-surface-200-700-token"
											>
												<Icon class="p-2" data={edit} scale={2.5} />
											</button>
											<button
												on:click={() => deleteChapter(chapter._id)}
												type="button"
												class="m-2 btn-icon bg-surface-200-700-token"
											>
												<Icon class="p-2" data={trash} scale={2.5} />
											</button>
										</div>
									</div>
								</div>
								<tr>
									<td class="w-1/4">
										<div class="flex items-center">
											<img
												src={chapter.book?.imageURL}
												alt="Book Cover"
												class="w-20 h-20 mr-2 p-1"
											/>

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
							<tr>
								<td colspan="4" class="p-4" />
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</body>
</div>

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
		max-width: 110%;
	}

	.dropdown-content-hidden {
		display: none;
	}
	.custom-padding {
		padding-top: 1rem;
	}
</style>
