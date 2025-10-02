<script lang="ts">
	import type { HydratedDocument } from 'mongoose';

	import { page } from '$app/stores';
	import BookPreview from '$lib/components/book/BookPreview.svelte';
	import ChapterPreview from '$lib/components/chapter/ChapterPreview.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import type { BookProperties } from '$lib/properties/book';
	import { trpcWithQuery } from '$lib/trpc/client';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { arrowDown } from 'svelte-awesome/icons';
	import StorylinePreview from '../storyline/StorylinePreview.svelte';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import IntersectionObserver from 'svelte-intersection-observer';
	import { type VisibleDocument, type RowAction } from '$lib/util/types';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { type HydratedResourceProperties } from '$lib/properties/resource';
	import ResourcePreview from '../resource/ResourcePreview.svelte';

	let customClass = '';
	export { customClass as class };
	export let gridStyle: string | 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6';
	export let limit: number | 8;
	export let documentType: VisibleDocument;
	export let selectedDocuments: string[] = [];
	export let parameters: any = {};
	export let action: RowAction | undefined = undefined;
	export let title: string | undefined = undefined;
	export let dispatchEvent: boolean = false;
	export let callback: (arg: any, selected: boolean) => void = () => {};
	export let user: any = undefined;
	export let supabase: any = undefined;

	let element: HTMLDivElement;
	let debouncedSearchValue = '';
	let intersecting = false;

	let query =
		documentType === 'Book'
			? trpcWithQuery($page).books
			: documentType === 'Storyline'
			? trpcWithQuery($page).storylines
			: documentType === 'Resource'
			? trpcWithQuery($page).resources
			: trpcWithQuery($page).chapters;

	$: getDocumentsInfinite = query.get.createInfiniteQuery(
		{
			limit: limit,
			...(parameters ?? {})
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

	$: loadMore(intersecting, items);

	onMount(() => {
		console.log('** selected docs');
		console.log(items);
	});

	function bookItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<BookProperties>;
	}

	function storylineItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<StorylineProperties>;
	}

	function chapterItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<ChapterProperties>;
	}

	function resourceItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<HydratedResourceProperties>;
	}

	function loadMore(intersecting: boolean, newItems: any) {
		if (intersecting) {
			$getDocumentsInfinite.fetchNextPage();
		}
	}

	function handleTryAgain() {
		$getDocumentsInfinite.refetch();
	}

	const modalStore = getModalStore();
	function handleSelected(event: { detail: any }) {
		const item = items.find((item) => item._id === event.detail);
		const selected = !selectedDocuments.includes(event.detail);
		callback(item, selected);
	}

	function handleUpdated(event: { detail: any }) {
		console.log('** updated event');
		items = items.map((item) => (item._id === event.detail._id ? event.detail : item));
		console.log(items);
	}

	function handleStorylineDeleted(deletedStorylineId: string) {
		// Filter out the deleted storyline and trigger reactivity
		items = items.filter((item) => item._id.toString() !== deletedStorylineId);
	}
</script>

<div class="rounded-lg {action && 'variant-filled'}">
	{#if title}
		<div class="w-full flex flex-col p-2 items-center">
			<p class="text-lg variant-filled p-3 rounded-full">{title}</p>
		</div>
	{/if}
	{#if $getDocumentsInfinite.isLoading}
		<div class="flex justify-center items-center pb-32">
			<LoadingSpinner />
		</div>
	{:else if $getDocumentsInfinite.isError}
		<div class="text-center flex flex-col justify-center pb-32">
			<InfoHeader emoji="🤕" heading="Something went wrong!" description="How about trying again?">
				<button class="btn variant-filled-primary" on:click={handleTryAgain}>Reload</button>
			</InfoHeader>
		</div>
	{:else if items.length === 0}
		{#if !action}
			<div class="text-center flex flex-col items-center p-32">
				<InfoHeader
					emoji="🤲"
					heading="We're empty handed!"
					description={'Try changing your filters...'}
				>
					{#if documentType === 'Book' || documentType === 'Storyline'}
						<a href="/book/create" class="btn variant-filled-primary">Start writing</a>
					{/if}
				</InfoHeader>
			</div>
		{/if}
	{:else}
		<div class="{customClass} pt-4 px-2 grid grid-flow-row gap-2 w-full {gridStyle}">
			{#each items as item (item._id)}
				<div class="animate-fade animate-once animate-duration-1000 animate-ease-in-out">
					{#if documentType === 'Book'}
						<BookPreview book={bookItem(item)} />
					{:else if documentType === 'Storyline'}
						<StorylinePreview
							selected={selectedDocuments.includes(item._id.toString())}
							{dispatchEvent}
							on:selectedStoryline={handleSelected}
							{user}
							{supabase}
							storyline={storylineItem(item)}
							onUpdate={() => handleStorylineDeleted(item._id.toString())}
						/>
					{:else if documentType === 'Chapter'}
						<ChapterPreview chapter={chapterItem(item)} />
					{:else}
						<ResourcePreview
							{dispatchEvent}
							on:updatedResource={handleUpdated}
							resource={resourceItem(item)}
						/>
					{/if}
				</div>
			{/each}
		</div>

		{#if $getDocumentsInfinite.hasNextPage}
			<IntersectionObserver {element} bind:intersecting>
				<div bind:this={element} class="flex justify-center my-12">
					<Tooltip
						on:click={() => {
							loadMore(true, []);
						}}
						content="Load more"
						placement="top"
						target="reading-list"
					>
						<button class="btn-icon variant-filled">
							<Icon data={arrowDown} />
						</button>
					</Tooltip>
				</div>
			</IntersectionObserver>
		{/if}
	{/if}
	{#if action}
		<div class="w-full flex flex-col p-2 items-center">
			<button class="{action.class} btn variant-filled-primary gap-2" on:click={action.callback}>
				<Icon class="top-0 cursor-pointer" data={action.icon} scale={1} />
				{action.label}
			</button>
		</div>
	{/if}
</div>
