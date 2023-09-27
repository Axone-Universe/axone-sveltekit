<script lang="ts">
	import { ListBox, ListBoxItem, popup, Avatar } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome';
	import { caretDown, lock } from 'svelte-awesome/icons';
	import { afterUpdate } from 'svelte';

	import type { PageData } from './$types';
	import Container from '$lib/components/Container.svelte';
	import BookHeader from '$lib/components/book/BookHeader.svelte';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import type { ChapterProperties } from '$lib/properties/chapter';

	export let data: PageData;
	$: ({ bookData, storylines, activeStoryline } = data);

	afterUpdate(() => {
		loadChapters(activeStoryline._id);
		storylinesList = activeStoryline?._id;
	});

	let storylinesList: string;
	const popupCombobox: PopupSettings = {
		event: 'focus-click',
		target: 'popupCombobox',
		placement: 'bottom',
		closeQuery: '.listbox-item'
	};

	async function loadChapters(storylineID: string) {
		let activateStoryline = storylines[storylineID];

		if (!activateStoryline.chapters) {
			activeStoryline = activateStoryline;
			return;
		}

		if (activateStoryline.chapters.length === 0) {
			activeStoryline = activateStoryline;
			return;
		}

		if (typeof activateStoryline.chapters[0] !== 'string') {
			activeStoryline = activateStoryline;
			return;
		}

		trpc($page)
			.chapters.getByStoryline.query({
				storylineChapterIDs: activateStoryline.chapters as string[]
			})
			.then((chaptersResponse) => {
				activateStoryline.chapters = chaptersResponse as HydratedDocument<ChapterProperties>[];
				activeStoryline = activateStoryline;
			});
	}
</script>

<Container class="mx-2 md:mx-40 xl:mx-96">
	<BookHeader {bookData} storylineData={activeStoryline} />
	<div class="px-4 md:px-10 overflow-hidden space-y-4">
		<div class="flex w-full p-4 space-x-4">
			<div class="flex items-center justify-start w-3/5">
				<p class="text-l md:text-3xl font-bold">Storylines</p>
			</div>
			<div class="flex justify-end w-2/5">
				<button class="flex btn variant-filled space-x-12 w-full" use:popup={popupCombobox}>
					<p class="capitalize text-sm line-clamp-1">{activeStoryline?.title ?? 'Story Lines'}</p>
					<!-- <Icon data={caretDown} scale={1} /> -->
				</button>

				<div class="card w-60 shadow-xl p-2" data-popup="popupCombobox">
					<ListBox>
						{#each Object.entries(storylines) as [id, storyline]}
							<ListBoxItem
								on:click={() => loadChapters(id)}
								bind:group={storylinesList}
								name=""
								class="soft-listbox"
								value={storyline._id}
							>
								<div class="line-clamp-1 flex justify-between items-center">
									<p class="line-clamp-1">{storyline.title}</p>
									{#if !storyline.userPermissions?.view}
										<Icon data={lock} scale={1.2} />
									{/if}
								</div>
							</ListBoxItem>
						{/each}
					</ListBox>
					<div class="arrow bg-surface-100-800-token" />
				</div>
			</div>
		</div>
		<div class="flex flex-col w-full space-y-4">
			{#if activeStoryline.chapters}
				{#each activeStoryline.chapters as chapter}
					{#if typeof chapter !== 'string'}
						<div class="space-y-2 text-center lg:text-left">
							<p class="text-xl font-bold">{chapter.title}</p>
							<div class="flex justify-start items-center space-x-2">
								<Avatar
									src="https://source.unsplash.com/YOErFW8AfkI/32x32"
									width="w-8"
									rounded="rounded-full"
								/>
								<div class="flex-auto flex justify-between items-center">
									{#if typeof chapter.user !== 'string'}
										<h6 class="font-bold">By {chapter.user?.firstName}</h6>
									{/if}
									<small>On 17/06/2023</small>
								</div>
							</div>
							<div class="flex flex-col justify-between items-center">
								<p class="w-full font-thin line-clamp-2">
									{chapter.description}
								</p>
								<div class="btn-group variant-filled">
									<a
										class="button"
										href="/reader/{bookData._id}?storylineID={activeStoryline._id}&chapterID={chapter._id}"
										>Read</a
									>
									<a
										class="button"
										href="/editor/{bookData._id}?storylineID={activeStoryline._id}&chapterID={chapter._id}"
										>Edit</a
									>
									<a
										class="button"
										href="/storyline/create?bookID={bookData._id}&parentStorylineID={activeStoryline._id}&chapterID={chapter._id}"
										>+</a
									>
								</div>
							</div>

							<hr class="opacity-100" />
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	</div>
</Container>
