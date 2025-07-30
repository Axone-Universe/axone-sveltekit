<script lang="ts">
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { type MarketFilterTag } from '$lib/util/types';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import DocumentsInfiniteScroll from '$lib/components/documents/DocumentsInfiniteScroll.svelte';
	import type { PageData } from './$types';
	import { marketFilterTags } from '$lib/util/constants';

	export let data: PageData;
	export let { user } = data;

	const SEARCH_DEBOUNCE_SECONDS = 1.0;
	const TAGS_FILTER_KEY = $page.url + '-tags';

	let tags: MarketFilterTag[] = ['listed', 'newest'];

	let filterCount = -1;
	let mounted = false;

	$: tagsSet = false;

	$: if (browser && mounted) {
		sessionStorage.setItem(TAGS_FILTER_KEY, JSON.stringify(tags));
		filterCount = tags.length;
	}

	$: parameters = {
		tags: tags,
		title: debouncedSearchValue ? debouncedSearchValue : undefined
	};

	let accordionOpen = false;
	let searchValue = '';
	let debouncedSearchValue = '';

	function handleClear() {
		tags = [];
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
		const tagFilters = sessionStorage.getItem(TAGS_FILTER_KEY) ?? undefined;

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
			}
		}

		window.addEventListener('click', onClickListener);
		mounted = true;

		return () => {
			window.removeEventListener('click', onClickListener);
		};
	});
</script>

<Container class="w-full min-h-screen">
	<div class="sticky top-[4.7rem] z-[2] flex flex-col gap-1">
		<input
			id="search-input"
			class="input text-sm h-8 p-2"
			title="Search for stoylines"
			type="search"
			placeholder="Search storylines by title or #tag"
			bind:value={searchValue}
			on:input={onType}
		/>
		<div>
			<div
				id="filters-container"
				class="m-2 bg-surface-200-700-token rounded-lg bg-opacity-90 p-4 space-y-2"
			>
				<div class="flex justify-between items-center">
					<p>Filters</p>
					<button class="btn btn-sm variant-filled-surface h-fit" on:click={handleClear}>
						Clear
					</button>
				</div>

				<div id="filters" class="!max-h-[150px] overflow-y-auto space-y-2">
					<div class="flex flex-wrap gap-2">
						{#each marketFilterTags as tag}
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
			</div>
		</div>
	</div>

	{#if tagsSet}
		<DocumentsInfiniteScroll
			documentType="Resource"
			{parameters}
			gridStyle={'grid-cols-2 md:grid-cols-4 lg::grid-cols-6'}
			limit={18}
		/>
	{/if}
</Container>
