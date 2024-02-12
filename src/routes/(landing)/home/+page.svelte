<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { filter } from 'svelte-awesome/icons';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import BookPreview from '$lib/components/book/BookPreview.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import type { BookProperties } from '$lib/properties/book';
	import { GENRES, type Genre } from '$lib/properties/genre';
	import { HOME_FILTER_TAGS, type HomeFilterTag } from '$lib/util/types';
	import { trpcWithQuery } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { debouncedScrollCallback } from '$lib/util/debouncedCallback';
	import ScrollToTopButton from '$lib/components/util/ScrollToTopButton.svelte';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import Tutorial from './tutorial.svelte';

	const SEARCH_DEBOUNCE_SECONDS = 1.0;
	const TAGS_FILTER_KEY = $page.url + '-tags';
	const GENRES_FILTER_KEY = $page.url + '-genres';

	let genres: Genre[] = [];
	let tags: HomeFilterTag[] = [];

	let lastLoadEpoch = 0;
	let filterCount = -1;
	let mounted = false;

	$: if (browser && mounted) {
		sessionStorage.setItem(TAGS_FILTER_KEY, JSON.stringify(tags));
		sessionStorage.setItem(GENRES_FILTER_KEY, JSON.stringify(genres));
		filterCount = genres.length + tags.length;
	}

	let accordionOpen = false;
	let searchValue = '';
	let debouncedSearchValue = '';
	let scroll = 0;

	$: getBooksInfinite = trpcWithQuery($page).books.get.createInfiniteQuery(
		{
			limit: 20,
			genres: genres,
			tags: tags,
			title: debouncedSearchValue ? debouncedSearchValue : undefined
		},
		{
			queryKey: ['booksHome' + scroll++, debouncedSearchValue],
			getNextPageParam: (lastPage) => lastPage.cursor,
			staleTime: Infinity
		}
	);

	$: items = $getBooksInfinite.data
		? ($getBooksInfinite.data.pages.flatMap(
				(page) => page.data
		  ) as HydratedDocument<BookProperties>[])
		: [];

	function handleClear() {
		genres = [];
	}

	function loadMore() {
		lastLoadEpoch = debouncedScrollCallback(lastLoadEpoch, $getBooksInfinite.fetchNextPage);
	}

	function handleTryAgain() {
		$getBooksInfinite.refetch();
	}

	function debounce(timeout = SEARCH_DEBOUNCE_SECONDS * 1000) {
		let timer: NodeJS.Timeout;

		return () => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				debouncedSearchValue = searchValue;
			}, timeout);
		};
	}

	const onType = debounce();

	onMount(() => {
		const genreFilters = sessionStorage.getItem(GENRES_FILTER_KEY) ?? undefined;
		const tagFilters = sessionStorage.getItem(TAGS_FILTER_KEY) ?? undefined;

		if (genreFilters && genreFilters !== 'null') {
			genres = JSON.parse(genreFilters!);
		}

		if (tagFilters && tagFilters !== 'null') {
			tags = JSON.parse(tagFilters!);
		}

		function onClickListener(e: MouseEvent) {
			if (e.target) {
				const acc = (e.target as HTMLElement).closest('.accordion');
				if (!acc) {
					accordionOpen = false;
				}
			}
		}
		window.addEventListener('click', onClickListener);

		mounted = true;

		// setupTour();

		return () => {
			window.removeEventListener('click', onClickListener);
		};
	});
</script>

<svelte:window on:scroll={loadMore} />

<Tutorial />
<Container class="w-full min-h-screen">
	<div class="sticky top-[4.7rem] z-[2] flex flex-col gap-1">
		<input
			id="search-input"
			class="input text-sm h-8 p-2"
			title="Search for books"
			type="search"
			placeholder="Search for a book title"
			bind:value={searchValue}
			on:input={onType}
		/>
		<Accordion
			hover="hover:none"
			regionPanel="absolute accordion"
			padding="py-1"
			regionControl="px-4 h-8 accordion"
		>
			<AccordionItem id="filter-input" bind:open={accordionOpen}>
				<svelte:fragment slot="lead"><Icon data={filter} class="mb-1" /></svelte:fragment>
				<svelte:fragment slot="summary"
					><p>Filters {`${filterCount > -1 ? `(${filterCount})` : ''}`}</p></svelte:fragment
				>
				<svelte:fragment slot="content">
					<div class="card p-4 space-y-2">
						<p class="font-bold">Tags</p>
						<div class="flex flex-wrap gap-2">
							{#each HOME_FILTER_TAGS as tag}
								<button
									class="chip {tags.includes(tag) ? 'variant-filled-primary' : 'variant-soft'}"
									on:click={() => {
										const index = tags.indexOf(tag);
										if (index > -1) {
											tags = tags.filter((v) => v !== tag);
										} else {
											tags = [...tags, tag];
										}
									}}
								>
									<p>{tag}</p>
								</button>
							{/each}
						</div>
						<hr />
						<div class="flex justify-between items-center">
							<p class="font-bold">Genres</p>
							<button class="btn btn-sm variant-filled-surface h-fit" on:click={handleClear}>
								Clear
							</button>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each GENRES as genre}
								<button
									class="chip {genres.includes(genre) ? 'variant-filled-primary' : 'variant-soft'}"
									on:click={() => {
										const index = genres.indexOf(genre);
										if (index > -1) {
											genres = genres.filter((v) => v !== genre);
										} else {
											genres = [...genres, genre];
										}
									}}
								>
									<span class="capitalize">{genre}</span>
								</button>
							{/each}
						</div>
					</div>
				</svelte:fragment>
			</AccordionItem>
		</Accordion>
	</div>

	{#if $getBooksInfinite.isLoading}
		<div class="h-screen flex justify-center items-center pb-32">
			<LoadingSpinner />
		</div>
	{:else if $getBooksInfinite.isError}
		<div class="text-center min-h-screen flex flex-col justify-center pb-32">
			<InfoHeader emoji="🤕" heading="Something went wrong!" description="How about trying again?">
				<button class="btn variant-filled-primary" on:click={handleTryAgain}>Reload</button>
			</InfoHeader>
		</div>
	{:else if items.length === 0}
		<div class="text-center min-h-screen flex flex-col justify-center pb-32">
			<InfoHeader
				emoji="🤲"
				heading="We're empty handed!"
				description={tags.length !== 0
					? "We can't find any books that match your genre preferences. Try changing your filters!"
					: 'Try changing your filters or write your own book!'}
			>
				{#if tags.length === 0}
					<a href="/book/create" class="btn variant-filled-primary">Start writing</a>
				{/if}
			</InfoHeader>
		</div>
	{:else}
		<div class="min-h-screen">
			<div
				class="pt-4 px-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 grid-flow-row gap-2 w-full"
			>
				{#each items as item}
					<div class="animate-fade animate-once animate-duration-1000 animate-ease-in-out">
						<BookPreview book={item} />
					</div>
				{/each}
			</div>
			{#if !$getBooksInfinite.hasNextPage}
				<ScrollToTopButton />
			{/if}
		</div>
	{/if}
</Container>
