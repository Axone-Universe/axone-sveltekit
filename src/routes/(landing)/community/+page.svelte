<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import { Icon } from 'svelte-awesome';
	import { filter } from 'svelte-awesome/icons';

	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import UserPreview from '$lib/components/user/UserPreview.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import { USER_LABELS, type UserLabel, type UserProperties } from '$lib/properties/user';
	import { GenresBuilder, GENRES } from '$lib/properties/genre';
	import { trpcWithQuery } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { debouncedScrollCallback } from '$lib/util/debouncedCallback';
	import ScrollToTopButton from '$lib/components/util/ScrollToTopButton.svelte';
	import InfoHeader from '$lib/components/InfoHeader.svelte';

	const SEARCH_DEBOUNCE_SECONDS = 1.0;
	const FILTERS_KEY = 'creatorsFilters';

	let lastLoadEpoch = 0;
	let genresBuilder = new GenresBuilder();
	let filterCount = -1;
	let mounted = false;

	let userLabels: UserLabel[] = [];

	$: if (browser && mounted) {
		sessionStorage.setItem(
			FILTERS_KEY,
			JSON.stringify({ userLabels, genres: genresBuilder.build() })
		);
		filterCount = userLabels.length + genresBuilder.build().length;
	}

	let accordionOpen = false;

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
			queryKey: ['usersHome', genresBuilder.build(), debouncedSearchValue],
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
				const acc = (e.target as HTMLElement).closest('.accordion');
				if (!acc) {
					accordionOpen = false;
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
	<div class="sticky top-[4.7rem] z-[2] flex flex-col gap-1">
		<input
			class="input text-sm h-8 p-2"
			title="Search for users"
			type="search"
			placeholder="Search for a user name"
			bind:value={searchValue}
			on:input={onType}
		/>
		<Accordion
			hover="hover:none"
			regionPanel="absolute accordion"
			padding="py-1"
			regionControl="px-4 h-8 accordion"
		>
			<AccordionItem bind:open={accordionOpen}>
				<svelte:fragment slot="lead"><Icon data={filter} class="mb-1" /></svelte:fragment>
				<svelte:fragment slot="summary"
					><p>Filters {`${filterCount > -1 ? `(${filterCount})` : ''}`}</p></svelte:fragment
				>
				<svelte:fragment slot="content">
					<div class="card p-4 space-y-2">
						<p class="font-bold">Tags</p>
						<div class="flex flex-wrap gap-2">
							{#each USER_LABELS as userLabel}
								<button
									class={`chip ${
										userLabels && userLabels.includes(userLabel)
											? 'variant-filled-primary'
											: 'variant-soft'
									}`}
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
										// selectedTag = null;
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
			<div
				class="pt-4 px-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 grid-flow-row gap-2 w-full"
			>
				{#each items as item (item._id)}
					<div class="animate-fade animate-once animate-duration-1000 animate-ease-in-out">
						<UserPreview userData={item} />
					</div>
				{/each}
			</div>
			{#if !$getUsersInfinite.hasNextPage}
				<ScrollToTopButton />
			{/if}
		</div>
	{/if}
</Container>
