<script lang="ts">
	import type { BookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import { leanpub, star, infoCircle, caretDown, eyeSlash, bookmark } from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { afterUpdate, createEventDispatcher, onMount } from 'svelte';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import {
		type PopupSettings,
		popup,
		ListBox,
		ListBoxItem,
		type ModalSettings,
		getModalStore
	} from '@skeletonlabs/skeleton';
	import type { Genre } from '$lib/properties/genre';
	import Tooltip from '$lib/components/Tooltip.svelte';

	import { page } from '$app/stores';
	import type { UserProperties } from '$lib/properties/user';
	import { trpc } from '$lib/trpc/client';
	import type { Session } from '@supabase/supabase-js';
	import DocumentCarousel from '../documents/DocumentCarousel.svelte';

	let customClass = '';
	export { customClass as class };
	export let bookData: HydratedDocument<BookProperties>;
	export let storylines: { [key: string]: HydratedDocument<StorylineProperties> } = {};
	export let session: Session | null;
	export let storylineData: HydratedDocument<StorylineProperties>;

	let bookGenres: Genre[] | undefined;
	let user: HydratedDocument<UserProperties> | undefined = undefined;

	const modalStore = getModalStore();

	onMount(() => {
		user = $page.data.user;
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

	const readingListModal: ModalSettings = {
		type: 'component',
		component: 'readingListModal',
		title: 'Add to Reading List',
		response: (r) => {
			if (r) addToReadingList(r);
		}
	};

	let selectedStoryline: HydratedDocument<StorylineProperties> = storylineData;
	const storylinesPopup: PopupSettings = {
		event: 'focus-click',
		target: 'storylinesPopup',
		placement: 'bottom',
		closeQuery: '.listbox-item'
	};

	let dispatch = createEventDispatcher();
	function handleSelected(event: { detail: any }) {
		storylineData = storylines[event.detail];
		dispatch('selectedStoryline', event.detail);
	}

	function openReadingListModal() {
		readingListModal.meta = {
			user,
			storylineID: selectedStoryline!._id
		};
		readingListModal.body = `Select the reading lists to add "${selectedStoryline!.title}" to.`;
		modalStore.trigger(readingListModal);
	}

	async function addToReadingList(names: string[]) {
		try {
			user = (
				await trpc($page).users.updateReadingLists.mutate({
					names,
					storylineID: selectedStoryline!._id
				})
			).data as HydratedDocument<UserProperties>;
		} catch (e) {
			console.log(e);
		}
	}
</script>

<div
	class={`bg-center bg-no-repeat bg-cover rounded-lg ${customClass}`}
	style="background-image: url({storylineData.imageURL})"
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
				<div class="flex flex-col p-2 space-x-4 w-full items-center">
					<div class="flex flex-row items-center w-fit gap-4">
						<button use:popup={infoPopup}>
							<Icon class="top-0 cursor-pointer icon-info" data={infoCircle} scale={1.5} />
						</button>

						<h3 class="book-title">{storylineData.title}</h3>
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
									rel="noreferrer"
								>
									More
								</a>
							</div>
							<div class="arrow bg-surface-100-800-token" style="left: 140px; bottom: -4px;" />
						</div>
					</div>

					<DocumentCarousel
						on:selectedStoryline={handleSelected}
						documentType="Storyline"
						documents={Object.values(storylines)}
					/>
				</div>

				<div class="flex flex-row space-x-2">
					<a href="/editor/{bookData._id}?mode=reader" class="btn variant-filled py-1">
						<Icon class="p-2" data={leanpub} scale={2.5} />
						Read
					</a>
					{#if session}
						<Tooltip
							on:click={openReadingListModal}
							content="Add to reading list"
							placement="top"
							target="reading-list"
						>
							<button id="reading-list-btn" class="btn-icon variant-filled">
								<Icon class="p-2" data={bookmark} scale={2.5} />
							</button>
						</Tooltip>
					{/if}
					{#if storylineData.numRatings > 0}
						<div class="overflow-hidden flex items-center">
							<Icon class="p-2" data={star} scale={2} />
							<p class="text-lg font-bold">{storylineData.numRatings}</p>
						</div>
					{/if}
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

<!-- TODO: fix this file -->

<style>
	@font-face {
		font-family: righteous;
		src: url('/fonts/Righteous-Regular.ttf') format('opentype');
	}

	.book-title {
		font-family: righteous;
	}
</style>
