<script lang="ts">
	import type { HydratedDocument } from 'mongoose';

	import { page } from '$app/stores';
	import BookPreview from '$lib/components/book/BookPreview.svelte';
	import ChapterPreview from '$lib/components/chapter/ChapterPreview.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import type { BookProperties } from '$lib/properties/book';
	import { trpcWithQuery } from '$lib/trpc/client';
	import ScrollToTopButton from '$lib/components/util/ScrollToTopButton.svelte';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import { afterUpdate, beforeUpdate, onMount } from 'svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { arrowDown } from 'svelte-awesome/icons';
	import type { PermissionedDocument } from '$lib/properties/permission';
	import StorylinePreview from '../storyline/StorylinePreview.svelte';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import Tooltip from '$lib/components/Tooltip.svelte';

	let customClass = '';
	export { customClass as class };
	export let userID: string | null;
	export let gridStyle: string | 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6';
	export let limit: number | 8;
	export let documentType: PermissionedDocument;

	let debouncedSearchValue = '';

	let query =
		documentType === 'Book'
			? trpcWithQuery($page).books
			: documentType === 'Storyline'
			? trpcWithQuery($page).storylines
			: trpcWithQuery($page).chapters;

	$: getDocumentsInfinite = query.get.createInfiniteQuery(
		{
			limit: limit,
			...(userID ? { user: userID } : {})
		},
		{
			queryKey: [`${documentType}Component`, debouncedSearchValue],
			getNextPageParam: (lastPage) => lastPage.cursor,
			staleTime: Infinity
		}
	);

	$: items = $getDocumentsInfinite.data
		? ($getDocumentsInfinite.data.pages.flatMap((page) => page.data) as HydratedDocument<unknown>[])
		: [];

	function bookItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<BookProperties>;
	}

	function storylineItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<StorylineProperties>;
	}

	function chapterItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<ChapterProperties>;
	}

	function loadMore() {
		$getDocumentsInfinite.fetchNextPage();
	}

	function handleTryAgain() {
		$getDocumentsInfinite.refetch();
	}
</script>

<div class={customClass}>
	{#if $getDocumentsInfinite.isLoading}
		<div class="h-screen flex justify-center items-center pb-32">
			<LoadingSpinner />
		</div>
	{:else if $getDocumentsInfinite.isError}
		<div class="text-center min-h-screen flex flex-col justify-center pb-32">
			<InfoHeader emoji="🤕" heading="Something went wrong!" description="How about trying again?">
				<button class="btn variant-filled-primary" on:click={handleTryAgain}>Reload</button>
			</InfoHeader>
		</div>
	{:else}
		<div class="max-h-[600px] overflow-auto">
			<div class="pt-4 px-2 grid grid-flow-row gap-2 w-full {gridStyle}">
				{#each items as item (item._id)}
					<div class="animate-fade animate-once animate-duration-1000 animate-ease-in-out">
						{#if documentType === 'Book'}
							<BookPreview book={bookItem(item)} />
						{:else if documentType === 'Storyline'}
							<StorylinePreview user={undefined} storyline={storylineItem(item)} />
						{:else}
							<ChapterPreview chapter={chapterItem(item)} />
						{/if}
					</div>
				{/each}
			</div>
			{#if $getDocumentsInfinite.hasNextPage}
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
</div>
