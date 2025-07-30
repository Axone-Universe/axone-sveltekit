<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import DocumentsInfiniteScroll from '$lib/components/documents/DocumentsInfiniteScroll.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	export let { user, supabase } = data;

	const SEARCH_DEBOUNCE_SECONDS = 1.0;

	$: parameters = {
		title: debouncedSearchValue ? debouncedSearchValue : undefined,
		userID: user._id
	};

	let searchValue = '';
	let debouncedSearchValue = '';

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
</script>

<Container class="w-full min-h-screen">
	<div class="sticky top-[4.7rem] z-[2] flex flex-col gap-1">
		<input
			id="search-input"
			class="input text-sm h-8 p-4"
			title="Search for stoylines"
			type="search"
			placeholder="Search resources by title"
			bind:value={searchValue}
			on:input={onType}
		/>
	</div>

	<DocumentsInfiniteScroll
		documentType="Resource"
		{parameters}
		gridStyle={'grid-cols-2 lg:grid-cols-4'}
		limit={18}
	/>
</Container>
