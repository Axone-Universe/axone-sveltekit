<script lang="ts">
	import type { BookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import { plus, leanpub, star, infoCircle, bookmark, bookmarkO } from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome';
	import { afterUpdate, onMount } from 'svelte';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import { type PopupSettings, popup } from '@skeletonlabs/skeleton';
	import type { Genre } from '$lib/properties/genre';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { ReadingListProperties } from '$lib/properties/readingList';
	import type { UserProperties } from '$lib/properties/user';

	export let bookData: HydratedDocument<BookProperties>;
	export let storylineData: HydratedDocument<StorylineProperties>;

	let bookGenres: Genre[] | undefined;
	let readingLists: HydratedDocument<ReadingListProperties>[] = [];

	onMount(() => {
		readingLists = JSON.parse(JSON.stringify($page.data.user.readingLists));
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
			});
	}
</script>

<div class="bg-center bg-no-repeat bg-cover" style="background-image: url({bookData.imageURL})">
	<div
		class="bg-gradient-to-b from-transparent from-10%
        [.dark_&]:via-[rgba(var(--color-surface-800))] via-[rgba(var(--color-surface-100))] via-50%
        [.dark_&]:to-[rgba(var(--color-surface-800))] to-[rgba(var(--color-surface-100))]
        w-full space-x-4"
	>
		<div class="px-4 md:px-10 pt-60 overflow-hidden space-y-4">
			<div class="p-2 space-y-4">
				<div class="flex flex-col items-center p-2">
					<p class="book-title text-4xl font-bold">
						{bookData.title}
					</p>
				</div>
				<div class="flex flex-row p-2 space-x-2">
					<p class="book-title text-2xl text-center font-bold line-clamp-1">
						{storylineData.title}
					</p>
					<div>
						<button use:popup={infoPopup}>
							<Icon class="top-0 cursor-pointer icon-info" data={infoCircle} scale={1.5} />
						</button>
						<div class="card p-4 w-72 shadow-xl" data-popup="infoPopup">
							<div class="space-y-4">
								<div>
									<p class="font-bold">Storylines</p>
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
					<div class="overflow-hidden flex items-center">
						<Icon class="p-2" data={star} scale={2} />
						<p class="text-sm font-bold line-clamp-1">4.5</p>
					</div>
				</div>

				<div class="flex flex-row space-x-2">
					<a href="/reader/{bookData._id}" class="btn variant-filled py-1">
						<Icon class="p-2" data={leanpub} scale={2.5} />
						Read
					</a>
					<div>
						<button use:popup={readingListPopup} type="button" class="btn-icon variant-filled">
							<Icon class="p-2" data={bookmark} scale={2.5} />
						</button>

						<div class="card p-4 w-fit shadow-xl" data-popup="readingListPopup">
							{#each readingLists as readingList}
								<!-- svelte-ignore a11y-click-events-have-key-events -->
								<div
									class="btn hover:variant-soft-primary cursor-pointer flex space-x-4 justify-between"
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
