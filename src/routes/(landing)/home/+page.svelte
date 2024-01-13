<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import { Icon } from 'svelte-awesome';
	import { expand, filter } from 'svelte-awesome/icons';

	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import BookPreview from '$lib/components/book/BookPreview.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import type { BookProperties } from '$lib/properties/book';
	import { GenresBuilder, GENRES } from '$lib/properties/genre';
	import { trpcWithQuery } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { debouncedScrollCallback } from '$lib/util/debouncedCallback';
	import ScrollToTopButton from '$lib/components/util/ScrollToTopButton.svelte';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import Tutorial from './tutorial.svelte';

	const SEARCH_DEBOUNCE_SECONDS = 1.0;
	const TAGS = ['Recommended', 'Campaigns'] as const;
	const FILTERS_KEY = 'homepageFilters';

	let lastLoadEpoch = 0;
	let genresBuilder = new GenresBuilder();
	let filterCount = -1;
	let mounted = false;

	let selectedTag: (typeof TAGS)[number] | null = 'Recommended';
	$: recommendedSelected = selectedTag === 'Recommended';
	$: campaignSelected = selectedTag === 'Campaigns';

	$: if (browser && mounted) {
		sessionStorage.setItem(
			FILTERS_KEY,
			JSON.stringify({ selectedTag, genres: genresBuilder.build() })
		);
		if (selectedTag) {
			filterCount = 1;
		} else {
			filterCount = genresBuilder.build().length;
		}
	}

	let accordionOpen = false;

	let searchValue = '';
	let debouncedSearchValue = '';

	$: getBooksInfinite = trpcWithQuery($page).books.get.createInfiniteQuery(
		{
			limit: 20,
			genres: recommendedSelected ? undefined : genresBuilder.build(),
			title: debouncedSearchValue ? debouncedSearchValue : undefined,
			campaign: campaignSelected ? '' : null
		},
		{
			queryKey: [
				'booksHome',
				recommendedSelected ? undefined : genresBuilder.build(),
				campaignSelected ? '' : null,
				debouncedSearchValue
			],
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
		genresBuilder = genresBuilder.reset();
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
		const filters = JSON.parse(sessionStorage.getItem(FILTERS_KEY) ?? 'null');

		if (filters) {
			selectedTag = filters.selectedTag ? filters.selectedTag : null;
			genresBuilder.withList(filters.genres ? filters.genres : []);
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
							{#each TAGS as tag}
								<button
									class={`chip ${selectedTag === tag ? 'variant-filled-primary' : 'variant-soft'}`}
									on:click={() => {
										if (selectedTag && selectedTag === tag) {
											selectedTag = null;
										} else {
											selectedTag = tag;
										}
										genresBuilder = genresBuilder.reset();
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
									class={`chip ${
										genresBuilder.build().includes(genre)
											? 'variant-filled-primary'
											: 'variant-soft'
									}`}
									on:click={() => {
										genresBuilder = genresBuilder.toggle(genre);
										selectedTag = null;
									}}
								>
									<p>{genre}</p>
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
				description={recommendedSelected
					? "We can't find any books that match your genre preferences. Try changing your filters!"
					: 'Try changing your filters or write your own book!'}
			>
				{#if !recommendedSelected}
					<a href="/book/create" class="btn variant-filled-primary">Start writing</a>
				{/if}
			</InfoHeader>
		</div>
	{:else}
		<div class="min-h-screen">
			<div
				class="pt-4 px-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 grid-flow-row gap-2 w-full"
			>
				{#each items as item (item._id)}
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
