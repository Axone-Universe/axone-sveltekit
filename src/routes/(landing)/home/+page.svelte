<script lang="ts">
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import { Icon } from 'svelte-awesome';
	import { arrowUp, filter } from 'svelte-awesome/icons';

	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import BookPreview from '$lib/components/book/BookPreview.svelte';
	import type { BookProperties } from '$lib/shared/book';
	import { GenresBuilder, GENRES } from '$lib/shared/genre';
	import { trpcWithQuery } from '$lib/trpc/client';

	export let data: PageData;

	const LOAD_DEBOUNCE_SECONDS = 1.0;
	// Only "recommended" is implemented for now
	// recommended looks at the user genre preferences to select books from there
	const TAGS = ['Recommended'] as const;
	// const TAGS = ['Trending', 'Recommended', 'Reading', 'Newest'] as const;

	let last_load_epoch = 0;
	let genresBuilder = new GenresBuilder();

	let selectedTag: (typeof TAGS)[number] | null = 'Recommended';
	$: recommendedSelected = selectedTag === 'Recommended';

	let accordionOpen = false;

	$: getBooksInfinite = trpcWithQuery($page).books.get.createInfiniteQuery(
		{ limit: 20, genres: recommendedSelected ? undefined : genresBuilder.build() },
		{
			queryKey: ['booksHome', recommendedSelected ? undefined : genresBuilder.build()],
			getNextPageParam: (lastPage) => lastPage.cursor
		}
	);

	$: items = $getBooksInfinite.data
		? ($getBooksInfinite.data.pages.flatMap(
				(page) => page.result
		  ) as HydratedDocument<BookProperties>[])
		: [];

	function handleClear() {
		genresBuilder = genresBuilder.reset();
	}

	function loadMore() {
		const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;

		if (
			window.scrollY >= scrollableHeight * 0.7 &&
			(last_load_epoch === 0 || Date.now() - last_load_epoch >= LOAD_DEBOUNCE_SECONDS * 1000)
		) {
			last_load_epoch = Date.now();
			$getBooksInfinite.fetchNextPage();
		}
	}

	function handleScrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:window on:scroll={loadMore} />

<Container class="p-4">
	<h1 class="my-8 text-center">Home</h1>

	<div class="sticky top-[4.5rem] z-[2]">
		<Accordion hover="hover:none" regionPanel="absolute" padding="py-2" regionControl="px-4">
			<AccordionItem bind:open={accordionOpen}>
				<svelte:fragment slot="lead"><Icon data={filter} class="mb-1" /></svelte:fragment>
				<svelte:fragment slot="summary"><p>Filters</p></svelte:fragment>
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
		<div class="mt-8 flex justify-center h-16">
			<img src="/tail-spin.svg" alt="Loading spinner" />
		</div>
	{:else if $getBooksInfinite.isError}
		<div class="mt-8 text-center space-y-8">
			<div>
				<p class="text-6xl">🤕</p>
				<h4>Something went wrong while fetching books!</h4>
				<p>How about trying again?</p>
			</div>
			<button class="btn variant-filled-primary">Try again</button>
		</div>
	{:else if items.length === 0}
		<div class="mt-8 text-center space-y-8">
			<div>
				<p class="text-6xl">😲</p>
				<h4>We've come up empty!</h4>
				<p>Why not write your own book?</p>
			</div>
			<a href="/book/create" class="btn variant-filled-primary">Start writing</a>
		</div>
	{:else}
		<div
			class="pt-4 px-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 grid-flow-row gap-2 w-full"
		>
			{#each items as item (item.title + item.imageURL)}
				<div class="animate-fade animate-once animate-duration-1000 animate-ease-in-out">
					<BookPreview book={item} />
				</div>
			{/each}
		</div>
		{#if !$getBooksInfinite.hasNextPage}
			<div class="flex justify-center my-12 italic font-bold">
				<button class="btn-icon variant-filled" on:click={handleScrollToTop}
					><Icon data={arrowUp} /></button
				>
			</div>
		{/if}
	{/if}
</Container>
