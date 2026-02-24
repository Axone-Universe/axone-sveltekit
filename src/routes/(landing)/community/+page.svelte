<script lang="ts">
	import type { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { arrowDown, filter, times } from 'svelte-awesome/icons';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import UserPreview from '$lib/components/user/UserPreview.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import { USER_LABELS, type UserLabel, type UserProperties } from '$lib/properties/user';
	import { GenresBuilder, GENRES, type Genre } from '$lib/properties/genre';
	import { trpcWithQuery } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';
	import { debouncedScrollCallback } from '$lib/util/debouncedCallback';
	import ScrollToTopButton from '$lib/components/util/ScrollToTopButton.svelte';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';

	export let data: PageData;
	export let { user: currentUser } = data;

	const SEARCH_DEBOUNCE_SECONDS = 1.0;
	const FILTERS_KEY = 'creatorsFilters';

	let lastLoadEpoch = 0;
	let genresBuilder = new GenresBuilder();
	let filterCount = -1;
	let mounted = false;
	let showFilters = false;

	let userLabels: UserLabel[] = [];
	let genres: Genre[] = [];

	$: genres = genresBuilder.build();

	$: if (browser && mounted) {
		sessionStorage.setItem(
			FILTERS_KEY,
			JSON.stringify({ userLabels, genres: genresBuilder.build() })
		);
		filterCount = userLabels.length + genresBuilder.build().length;
	}

	let searchValue = '';
	let debouncedSearchValue = '';

	$: getUsersInfinite = trpcWithQuery($page).users.get.createInfiniteQuery(
		{
			limit: 20,
			genres: genresBuilder.build(),
			labels: userLabels,
			detail: debouncedSearchValue ? debouncedSearchValue : undefined
		},
		{
			queryKey: ['usersHome', debouncedSearchValue],
			getNextPageParam: (lastPage) => lastPage.cursor,
			staleTime: Infinity
		}
	);

	$: items = $getUsersInfinite.data
		? ($getUsersInfinite.data.pages.flatMap(
				(page) => page.data
		  ) as HydratedDocument<UserProperties>[])
		: [];

	function handleClear() {
		genresBuilder = genresBuilder.reset();
		userLabels = [];
	}

	function toggleFilters() {
		showFilters = !showFilters;
	}

	function removeUserLabel(label: UserLabel) {
		userLabels = userLabels.filter((l) => l !== label);
	}

	function removeGenre(genre: Genre) {
		genresBuilder = genresBuilder.toggle(genre);
	}

	function loadMore() {
		lastLoadEpoch = debouncedScrollCallback(lastLoadEpoch, $getUsersInfinite.fetchNextPage);
	}

	function handleTryAgain() {
		$getUsersInfinite.refetch();
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
			userLabels = filters.userLabels ? filters.userLabels : [];
			genresBuilder.withList(filters.genres ? filters.genres : []);
		}

		function onClickListener(e: MouseEvent) {
			if (e.target) {
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

<svelte:window on:scroll={loadMore} />

<Container class="w-full min-h-screen">
	<div class="sticky top-0 lg:top-[4.7rem] z-[2] flex flex-col gap-2 pb-2 lg:pb-0">
		<input
			class="input text-base lg:text-sm h-12 lg:h-8 p-3 lg:p-2"
			title="Search for users"
			type="search"
			placeholder="Search for a user name"
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
			{#each userLabels as label}
				<button
					class="chip variant-filled-primary rounded-full text-xs"
					on:click={() => removeUserLabel(label)}
					title="Click to remove"
				>
					<span>{label}</span>
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
				class="m-2 rounded-lg p-4 space-y-2"
			>
				<div class="flex justify-between items-center">
					<p class="font-bold">Select Filters</p>
				</div>

				<div id="filters" class="!max-h-[200px] overflow-y-auto space-y-2">
					<div>
						<p class="text-sm mb-2 font-semibold">Tags</p>
						<div class="flex flex-wrap gap-2">
							{#each USER_LABELS as userLabel}
								<button
									class="chip rounded-full {userLabels.includes(userLabel)
										? 'variant-filled-primary'
										: 'variant-filled'}"
									on:click={() => {
										const index = userLabels.indexOf(userLabel);
										if (index > -1) {
											userLabels = userLabels.filter((v) => v !== userLabel);
										} else {
											userLabels = [...userLabels, userLabel];
										}
									}}
								>
									<p>{userLabel}</p>
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
										genresBuilder = genresBuilder.toggle(genre);
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

	{#if $getUsersInfinite.isLoading}
		<div class="h-screen flex justify-center items-center pb-32">
			<LoadingSpinner />
		</div>
	{:else if $getUsersInfinite.isError}
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
				description={'Try changing your filters'}
			/>
		</div>
	{:else}
		<div class="min-h-screen">
			<div class="pt-4 px-2 grid grid-cols-2 md:grid-cols-4 grid-flow-row gap-2 w-full">
				{#each items as item (item._id)}
					<div class="animate-fade animate-once animate-duration-1000 animate-ease-in-out">
						<UserPreview {currentUser} user={item} />
					</div>
				{/each}
			</div>
			{#if $getUsersInfinite.hasNextPage}
				<div class="flex justify-center my-12">
					<Tooltip on:click={loadMore} content="Load more" placement="top" target="reading-list">
						<button class="btn-icon variant-filled">
							<Icon data={arrowDown} />
						</button>
					</Tooltip>
				</div>
			{/if}
		</div>
	{/if}
</Container>
