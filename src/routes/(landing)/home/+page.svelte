<script lang="ts">
	import { FrameInfiniteGrid } from '@egjs/svelte-infinitegrid';

	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { GenresBuilder, GENRES, type Genre } from '$lib/shared/genre';

	import type { PageData } from './$types';
	import { trpcWithQuery } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { BookProperties } from '$lib/shared/book';

	const LOAD_DEBOUNCE_SECONDS = 1.0;
	let last_load_epoch = 0;
	let genresBuilder = new GenresBuilder();

	export let data: PageData;

	const getBooksInfinite = trpcWithQuery($page).books.getAll.createInfiniteQuery(
		{ limit: 10, genres: genresBuilder.build() },
		{
			queryKey: ['booksHome', genresBuilder.build()],
			getNextPageParam: (lastPage) => lastPage.cursor,
			cacheTime: 0
		}
	);

	$: items = $getBooksInfinite.data
		? ($getBooksInfinite.data.pages.flatMap(
				(page) => page.result
		  ) as HydratedDocument<BookProperties>[])
		: [];

	let ig;

	function onSearchClick() {
		$getBooksInfinite.refetch();
	}

	function onClearClick() {
		genresBuilder = genresBuilder.reset();
	}
</script>

<Container class="p-4">
	<h1 class="my-8 text-center">Home</h1>
	<div class="card flex items-center shadow-lg sticky top-[4.5rem] z-[2] w-full p-2 gap-2">
		<div class="flex flex-wrap gap-2">
			{#each GENRES as genre}
				<button
					class={`chip ${
						genresBuilder.build().includes(genre) ? 'variant-filled-primary' : 'variant-filled'
					}`}
					on:click={() => {
						genresBuilder = genresBuilder.toggle(genre);
					}}
				>
					<p>{genre}</p>
				</button>
			{/each}
		</div>

		<div class="flex flex-col gap-1">
			<button class="btn btn-sm variant-filled-primary h-fit" on:click={onSearchClick}
				>Search</button
			>
			<button class="btn btn-sm variant-filled-surface h-fit" on:click={onClearClick}>Clear</button>
		</div>
	</div>

	<div class="p-4">
		{#if $getBooksInfinite.isLoading}
			Loading...
		{:else if $getBooksInfinite.isError}
			{$getBooksInfinite.error}
		{:else if items.length == 0}
			<p>No books!</p>
		{:else}
			<FrameInfiniteGrid
				class="hidden sm:flex"
				gap={5}
				bind:this={ig}
				{items}
				let:visibleItems
				frame={[
					[1, 1, 2, 3, 3],
					[1, 1, 4, 4, 5]
				]}
				on:requestAppend={() => {
					if (
						last_load_epoch === 0 ||
						Date.now() - last_load_epoch >= LOAD_DEBOUNCE_SECONDS * 1000
					) {
						last_load_epoch = Date.now();
						$getBooksInfinite.fetchNextPage();
					}
				}}
			>
				{#each visibleItems as item (item.key)}
					<div
						class="rounded-lg overflow-hidden even:sm:w-32 even:md:w-64 odd:sm:w-24 odd:md:w-48 aspect-[2/3] relative cursor-pointer"
					>
						<img
							src={item.data.imageURL}
							alt={item.data.title}
							class="w-full h-full object-cover"
						/>
						<div
							class="group hover:bg-black/25 absolute top-0 w-full h-full bg-black/0 duration-300"
						>
							<div
								class="opacity-0 group-hover:opacity-100 flex flex-col justify-between items-center duration-300"
							>
								<p class="whitespace-normal text-lg font-bold">{item.data.title}</p>
							</div>
						</div>
					</div>
				{/each}
			</FrameInfiniteGrid>
			<div class="flex flex-col gap-5 sm:hidden">
				{#each items as item (item.title)}
					<div class="w-full aspect-[2/3] relative cursor-pointer">
						<img src={item.imageURL} alt={item.title} class="w-full h-full object-cover" />
						<div
							class="group hover:bg-black/25 absolute top-0 w-full h-full bg-black/0 duration-300"
						>
							<div
								class="opacity-0 group-hover:opacity-100 flex flex-col justify-between items-center duration-300"
							>
								<p class="whitespace-normal break-all text-lg font-bold">{item.title}</p>
								<p class="whitespace-normal break-all text-lg font-bold">{item.user}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</Container>
