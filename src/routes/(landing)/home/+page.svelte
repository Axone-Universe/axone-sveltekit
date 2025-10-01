<script lang="ts">
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { GENRES, type Genre } from '$lib/properties/genre';
	import { type HomeFilterTag } from '$lib/util/types';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Tutorial from './tutorial.svelte';
	import DocumentsInfiniteScroll from '$lib/components/documents/DocumentsInfiniteScroll.svelte';
	import type { PageData } from './$types';
	import { setupTour } from '../editor/[bookID]/tutorial';
	import { homeFilterTags } from '$lib/util/constants';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { filter, times } from 'svelte-awesome/icons';
	import ReadingListCarousel from '$lib/components/readingList/ReadingListCarousel.svelte';
	import { trpcWithQuery } from '$lib/trpc/client';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import type { HydratedDocument } from 'mongoose';
	import type { StorylineProperties } from '$lib/properties/storyline';

	export let data: PageData;
	export let { user } = data;

	const SEARCH_DEBOUNCE_SECONDS = 1.0;
	const TAGS_FILTER_KEY = $page.url + '-tags';
	const GENRES_FILTER_KEY = $page.url + '-genres';

	let genres: Genre[] = [];
	let tags: HomeFilterTag[] = ['Newest'];

	let filterCount = -1;
	let mounted = false;

	$: tagsSet = false;

	$: if (browser && mounted) {
		sessionStorage.setItem(TAGS_FILTER_KEY, JSON.stringify(tags));
		sessionStorage.setItem(GENRES_FILTER_KEY, JSON.stringify(genres));
		filterCount = genres.length + tags.length;
	}

	$: parameters = {
		genres: genres,
		tags: tags,
		title: debouncedSearchValue ? debouncedSearchValue : undefined
	};

	let accordionOpen = false;
	let searchValue = '';
	let debouncedSearchValue = '';
	let showFilters = false;

	function handleClear() {
		genres = [];
		tags = [];
	}

	function toggleFilters() {
		showFilters = !showFilters;
	}

	function removeGenre(genre: Genre) {
		genres = genres.filter((g) => g !== genre);
	}

	function removeTag(tag: HomeFilterTag) {
		tags = tags.filter((t) => t !== tag);
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

	// Fetch admin reading lists
	$: adminReadingListsQuery = trpcWithQuery($page).readingLists.getAdminReadingLists.createQuery();

	// Fetch storylines for reading lists
	$: storylineIds =
		$adminReadingListsQuery.data?.data?.flatMap((list: { storylineIds: string[] }) =>
			list.storylineIds.slice(0, 1)
		) || [];

	$: storylinesQuery = trpcWithQuery($page).storylines.getByIds.createQuery(
		{ ids: storylineIds },
		{
			enabled: storylineIds.length > 0
		}
	);

	$: hasReadingLists =
		$adminReadingListsQuery.data?.data &&
		$adminReadingListsQuery.data.data.length > 0 &&
		$storylinesQuery.data?.data;

	$: readingListStorylines =
		($storylinesQuery.data?.data as HydratedDocument<StorylineProperties>[]) || [];

	onMount(() => {
		const genreFilters = sessionStorage.getItem(GENRES_FILTER_KEY) ?? undefined;
		const tagFilters = sessionStorage.getItem(TAGS_FILTER_KEY) ?? undefined;

		if (genreFilters && genreFilters !== 'null') {
			genres = JSON.parse(genreFilters!);
		}

		if (tagFilters && tagFilters !== 'null') {
			tags = JSON.parse(tagFilters!);
		}

		tagsSet = true;

		function onClickListener(e: MouseEvent) {
			if (e.target) {
				const acc = (e.target as HTMLElement).closest('.accordion');
				if (!acc) {
					accordionOpen = false;
				}

				// Close filter panel if clicking outside of it
				const filterContainer = (e.target as HTMLElement).closest('#filters-container');
				const filterButton = (e.target as HTMLElement).closest('#filter-toggle-btn');
				if (!filterContainer && !filterButton && showFilters) {
					showFilters = false;
				}
			}
		}

		window.addEventListener('click', onClickListener);
		mounted = true;

		return () => {
			window.removeEventListener('click', onClickListener);
		};
	});
</script>

<Tutorial />

<Container class="w-full min-h-screen">
	<div class="sticky top-[4.7rem] z-[2] flex flex-col gap-2">
		<input
			id="search-input"
			class="input text-sm h-8 p-2"
			title="Search for stoylines"
			type="search"
			placeholder="Search storylines by title or #tag"
			bind:value={searchValue}
			on:input={onType}
		/>

		<!-- Filter button and selected chips row -->
		<div class="flex items-center gap-2 flex-wrap px-2">
			<button
				id="filter-toggle-btn"
				class="btn btn-sm variant-glass-primary gap-2"
				on:click={toggleFilters}
				title="Toggle filters"
			>
				<Icon data={filter} scale={1} />
				Filters
			</button>

			<!-- Display selected filters as chips -->
			{#each tags as tag}
				<button
					class="chip variant-filled-primary rounded-full text-xs"
					on:click={() => removeTag(tag)}
					title="Click to remove"
				>
					<span>{tag}</span>
					<Icon class="w-3 h-3" data={times} />
				</button>
			{/each}
			{#each genres as genre}
				<button
					class="chip variant-filled-primary rounded-full text-xs"
					on:click={() => removeGenre(genre)}
					title="Click to remove"
				>
					<span class="capitalize">{genre}</span>
					<Icon class="w-3 h-3" data={times} />
				</button>
			{/each}
		</div>

		<!-- Collapsible filter panel -->
		{#if showFilters}
			<div
				id="filters-container"
				class="m-2 bg-surface-200-700-token rounded-lg bg-opacity-90 p-4 space-y-2"
			>
				<div class="flex justify-between items-center">
					<p class="font-bold">Select Filters</p>
				</div>

				<div id="filters" class="!max-h-[200px] overflow-y-auto space-y-2">
					<div>
						<p class="text-sm mb-2 font-semibold">Tags</p>
						<div class="flex flex-wrap gap-2">
							{#each homeFilterTags as tag}
								<button
									class="chip rounded-full {tags.includes(tag)
										? 'variant-filled-primary'
										: 'variant-filled'}"
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
					</div>
					<hr />
					<div>
						<p class="text-sm mb-2 font-semibold">Genres</p>
						<div class="flex flex-wrap gap-2">
							{#each GENRES as genre}
								<button
									class="chip rounded-full {genres.includes(genre)
										? 'variant-filled-primary'
										: 'variant-filled'}"
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
				</div>
			</div>
		{/if}
	</div>

	<!-- Curated Reading Lists Section -->
	{#if hasReadingLists}
		<div
			class="relative w-full my-8 rounded-lg overflow-hidden bg-[url(/reading-list_bg.webp)] bg-cover bg-center"
		>
			<!-- Background decorative elements -->

			<div
				class="absolute inset-0 bg-gradient-to-b from-surface-50/90 dark:from-surface-900/90 to-transparent"
			/>

			<!-- Content -->
			<div class="relative z-10 p-6">
				<div class="mb-6">
					<h2 class="text-2xl md:text-3xl font-bold mb-2">The Curated Shelf</h2>
					<p class="text-lg text-surface-700-200-token">Handpicked collections from our editors</p>
				</div>

				{#if $adminReadingListsQuery.isLoading || $storylinesQuery.isLoading}
					<div class="flex justify-center py-8">
						<LoadingSpinner />
					</div>
				{:else if $adminReadingListsQuery.data?.data && $storylinesQuery.data?.data}
					<ReadingListCarousel
						readingLists={$adminReadingListsQuery.data.data}
						storylines={readingListStorylines}
						{user}
						supabase={data.supabase}
					/>
				{/if}
			</div>
		</div>
	{/if}

	{#if tagsSet}
		<DocumentsInfiniteScroll
			documentType="Storyline"
			{parameters}
			gridStyle={'grid-cols-2 md:grid-cols-6'}
			limit={18}
			{user}
			supabase={data.supabase}
		/>
	{/if}
</Container>
