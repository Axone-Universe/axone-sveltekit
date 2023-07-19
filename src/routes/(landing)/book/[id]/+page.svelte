<script lang="ts">
	import { ListBox, ListBoxItem, popup, Avatar } from '@skeletonlabs/skeleton';
	import type { PopupSettings } from '@skeletonlabs/skeleton';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import Icon from 'svelte-awesome';
	import { caretDown, plus, leanpub, star } from 'svelte-awesome/icons';
	import { afterUpdate } from 'svelte';

	import type { PageData } from './$types';
	import Container from '$lib/components/Container.svelte';
	import type { ChapterProperties } from '$lib/shared/chapter';
	import type { HydratedDocument } from 'mongoose';

	export let data: PageData;
	$: ({ bookData, storylines, activeStoryline } = data);

	let bookGenres: Record<string, boolean>;
	let activeChapters: HydratedDocument<ChapterProperties>[];

	afterUpdate(() => {
		loadChapters(activeStoryline._id);
		bookGenres = bookData.genres as unknown as Record<string, boolean>;
	});

	let comboboxValue: string;
	const popupCombobox: PopupSettings = {
		event: 'focus-click',
		target: 'popupCombobox',
		placement: 'bottom',
		closeQuery: '.listbox-item'
	};

	async function loadChapters(storylineID: string) {
		activeStoryline = storylines[storylineID];
		activeChapters = activeStoryline.chapters as HydratedDocument<ChapterProperties>[];
	}
</script>

<Container class="mx-2 md:mx-40 xl:mx-96">
	<div class="bg-center bg-no-repeat w-full" style="background-image: url({bookData.imageURL})">
		<div
			class="bg-gradient-to-b from-transparent from-10%
            [.dark_&]:via-[rgba(var(--color-surface-800))] via-[rgba(var(--color-surface-100))] via-50%
            [.dark_&]:to-[rgba(var(--color-surface-800))] to-[rgba(var(--color-surface-100))]
            w-full space-x-4"
		>
			<div class="px-4 md:px-10 pt-60 overflow-hidden space-y-4">
				<div class="p-2 space-y-4">
					<div class="flex flex-col p-2">
						<p class="book-title text-4xl font-bold line-clamp-1">
							{bookData.title}
						</p>
					</div>
					<div class="flex flex-row space-x-2">
						<a href="/reader" class="btn variant-filled py-1">
							<Icon class="p-2" data={leanpub} scale={2.5} />
							Read
						</a>
						<button type="button" class="btn-icon variant-filled">
							<Icon class="p-2" data={plus} scale={2} />
						</button>
						<button type="button" class="btn-icon variant-filled">
							<Icon class="p-2" data={star} scale={2} />
						</button>
						<div class="overflow-hidden flex items-center">
							<Icon class="p-2" data={star} scale={2} />
							<p class="text-sm font-bold line-clamp-1">4.5</p>
						</div>
					</div>
					<div class="space-x-2 line-clamp-1">
						{#if bookGenres}
							{#each Object.keys(bookGenres) as genre}
								{#if bookGenres[genre]}
									<div class="chip variant-filled">{genre}</div>
								{/if}
							{/each}
						{/if}
					</div>
				</div>
				<hr class="opacity-50" />
				<div>
					<p class="text-lg font-thin line-clamp-3 md:line-clamp-5">
						{bookData.description}
					</p>
				</div>
				<hr class="opacity-50" />
			</div>
		</div>
	</div>
	<div class="px-4 md:px-10 overflow-hidden space-y-4">
		<div class="flex w-full p-4 space-x-4">
			<div class="flex items-center justify-start w-3/5">
				<p class="text-l md:text-3xl font-bold">Chapters</p>
			</div>
			<div class="flex justify-end w-2/5">
				<button
					class="btn variant-filled space-x-12 line-clamp-1 w-full justify-between"
					use:popup={popupCombobox}
				>
					<span class="capitalize text-sm">{comboboxValue ?? 'Story Lines'}</span>
					<Icon data={caretDown} scale={1} />
				</button>

				<div class="card w-48 shadow-xl py-2" data-popup="popupCombobox">
					<ListBox rounded="rounded-none">
						{#each Object.entries(storylines) as [id, storyline]}
							<ListBoxItem
								on:click={() => loadChapters(id)}
								bind:group={comboboxValue}
								name=""
								value={storyline.title}
							>
								{storyline.title}
							</ListBoxItem>
						{/each}
					</ListBox>
					<div class="arrow bg-surface-100-800-token" />
				</div>
			</div>
		</div>
		<div class="flex flex-col w-full space-y-4">
			{#if activeChapters}
				{#each activeChapters as chapter}
					<div class="space-y-2 text-center lg:text-left">
						<p class="text-xl font-bold">{chapter.title}</p>
						<div class="flex justify-start items-center space-x-2">
							<Avatar
								src="https://source.unsplash.com/YOErFW8AfkI/32x32"
								width="w-8"
								rounded="rounded-full"
							/>
							<div class="flex-auto flex justify-between items-center">
								<h6 class="font-bold">By Alex</h6>
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
									href="/read/{bookData._id}?storylineID={activeStoryline._id}&chapterID={chapter._id}"
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
				{/each}
			{/if}
		</div>
	</div>
</Container>

<style>
	@font-face {
		font-family: righteous;
		src: url('/fonts/Righteous-Regular.ttf') format('opentype');
	}

	.book-title {
		font-family: righteous;
	}
</style>
