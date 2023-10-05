<script lang="ts">
	import type { BookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import {
		leanpub,
		star,
		infoCircle,
		bookmark,
		bookmarkO,
		lock,
		eyeSlash,
		caretDown
	} from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome';
	import { afterUpdate, createEventDispatcher, onMount } from 'svelte';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import { type PopupSettings, popup, ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import type { Genre } from '$lib/properties/genre';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { ReadingListProperties } from '$lib/properties/readingList';

	let customClass = '';
	export { customClass as class };
	export let bookData: HydratedDocument<BookProperties>;
	export let storylines: { [key: string]: HydratedDocument<StorylineProperties> } = {};
	export let storylineData: HydratedDocument<StorylineProperties>;

	let dispatch = createEventDispatcher();

	let bookGenres: Genre[] | undefined;
	let readingLists: HydratedDocument<ReadingListProperties>[] = [];

	onMount(() => {
		readingLists = JSON.parse(JSON.stringify($page.data.user.readingLists));
		showAddedToReadingList();
	});

	afterUpdate(() => {
		bookGenres = bookData.genres;
	});

	const infoPopup: PopupSettings = {
		// Represents the type of event that opens/closed the popup
		event: 'click',
		// Matches the data-popup value on your popup element
		target: 'infoPopup',
		// Defines which side of your trigger the popup will appear
		placement: 'top'
	};

	const readingListPopup: PopupSettings = {
		// Represents the type of event that opens/closed the popup
		event: 'click',
		// Matches the data-popup value on your popup element
		target: 'readingListPopup',
		// Defines which side of your trigger the popup will appear
		placement: 'right'
	};

	let selectedStoryline = '';
	const storylinesPopup: PopupSettings = {
		event: 'focus-click',
		target: 'storylinesPopup',
		placement: 'bottom',
		closeQuery: '.listbox-item'
	};

	// This is a variable to check if storyline is in a reading list
	let addedToReadingList = false;
	function showAddedToReadingList() {
		for (const readingList of readingLists) {
			if (storylineData._id in readingList.books) {
				addedToReadingList = true;
				return;
			}
		}
		addedToReadingList = false;
	}

	function addToReadingList(readingList: HydratedDocument<ReadingListProperties>) {
		if (storylineData._id in readingList.books) {
			delete readingList.books[storylineData._id];
		} else {
			readingList.books[storylineData._id] = storylineData._id;
		}

		trpc($page)
			.users.update.mutate({
				_id: $page.data.user._id,
				readingLists: readingLists
			})
			.then((userResponse: any) => {
				readingLists = userResponse.readingLists;
				showAddedToReadingList();
			});
	}

	const storylineClicked = (id: string) => {
		storylineData = storylines[id];
		dispatch('storylineClicked', id);
	};
</script>

<div
	class={`bg-center bg-no-repeat bg-cover ${customClass}`}
	style="background-image: url({bookData.imageURL})"
>
	<div
		class="bg-gradient-to-b from-transparent from-10%
        [.dark_&]:via-[rgba(var(--color-surface-900))] via-[rgba(var(--color-surface-50))] via-70%
        [.dark_&]:to-[rgba(var(--color-surface-900))] to-[rgba(var(--color-surface-50))]
        w-full space-x-4 h-full"
	>
		<div class="px-4 md:px-10 pt-60 overflow-hidden space-y-4">
			<div class="p-2 space-y-4">
				<div class="flex flex-col items-center p-2">
					<p class="book-title text-4xl font-bold">
						{bookData.title}
					</p>
				</div>
				<div class="flex flex-row items-center p-2">
					<div>
						<button use:popup={infoPopup}>
							<Icon class="top-0 cursor-pointer icon-info" data={infoCircle} scale={1.5} />
						</button>
						<div class="card p-4 w-72 shadow-xl" data-popup="infoPopup">
							<div class="space-y-4">
								<div>
									<p class="font-bold">Pick A Storyline</p>
									<p class="opacity-50">@Storyline</p>
								</div>
								<p>
									Storylines are alternative trajectories of the book stemming from the main
									storyline
								</p>
								<a
									class="btn variant-soft w-full"
									href="/storylines"
									target="_blank"
									rel="noreferrer">More</a
								>
							</div>
							<div class="arrow bg-surface-100-800-token" style="left: 140px; bottom: -4px;" />
						</div>
					</div>
					<div class="flex w-4/5 p-2 space-x-4">
						<div class="flex">
							<button class="flex space-x-12 w-full !bg-transparent" use:popup={storylinesPopup}>
								<p class="book-title text-2xl text-center font-bold line-clamp-1">
									{storylineData.title}
								</p>
								<Icon data={caretDown} scale={1.5} />
							</button>

							<div class="card w-96 shadow-xl p-2" data-popup="storylinesPopup">
								<ListBox>
									{#each Object.entries(storylines) as [id, storyline]}
										<ListBoxItem
											on:click={() => storylineClicked(id)}
											bind:group={selectedStoryline}
											name=""
											class="soft-listbox"
											value={storyline._id}
										>
											<div class="line-clamp-1 flex justify-between items-center">
												<p class="w-5/6 line-clamp-1">
													{storyline.title ? storyline.title : 'New Storyline'}
												</p>
												<div class="line-clamp-1 flex justify-end space-x-2 items-center">
													{#if !storyline.userPermissions?.view}
														<Icon data={eyeSlash} scale={1.2} />
													{/if}
												</div>
											</div>
										</ListBoxItem>
									{/each}
								</ListBox>
								<div class="arrow bg-surface-100-800-token" />
							</div>
						</div>
					</div>
					<div class="overflow-hidden flex items-center">
						<Icon class="p-2" data={star} scale={2} />
						<p class="text-lg font-bold">{storylineData.numRatings}</p>
					</div>
				</div>

				<div class="flex flex-row space-x-2">
					<a href="/editor/{bookData._id}?mode=reader" class="btn variant-filled py-1">
						<Icon class="p-2" data={leanpub} scale={2.5} />
						Read
					</a>
					<div>
						<button use:popup={readingListPopup} type="button" class="btn-icon variant-filled">
							{#if addedToReadingList}
								<Icon class="p-2" data={bookmark} scale={2.5} />
							{:else}
								<Icon class="p-2" data={bookmarkO} scale={2.5} />
							{/if}
						</button>

						<div class="card p-4 space-y-2 w-fit shadow-xl" data-popup="readingListPopup">
							{#each readingLists as readingList}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<div
									class="btn variant-soft-primary cursor-pointer flex space-x-4 justify-between"
									on:click={() => addToReadingList(readingList)}
								>
									<p class="line-clamp-1">{readingList.title}</p>
									{#if storylineData._id in readingList.books}
										<Icon data={bookmark} scale={1.2} />
									{:else}
										<Icon data={bookmarkO} scale={1.2} />
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
				<div class="space-x-2 line-clamp-1">
					{#if bookGenres}
						{#each bookGenres as genre}
							<div class="chip variant-filled">{genre}</div>
						{/each}
					{/if}
				</div>
			</div>
			<hr class="opacity-50" />
			<div>
				<p class="text-lg font-thin line-clamp-3 md:line-clamp-5">
					{storylineData.description}
				</p>
			</div>
			<hr class="opacity-50" />
		</div>
	</div>
</div>

<style>
	@font-face {
		font-family: righteous;
		src: url('/fonts/Righteous-Regular.ttf') format('opentype');
	}

	.book-title {
		font-family: righteous;
	}
</style>
