<script lang="ts">
	import Section from '$lib/components/Section.svelte';

	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { arrowCircleRight, arrowCircleLeft } from 'svelte-awesome/icons';
	import type { PermissionedDocument } from '$lib/properties/permission';
	import type { HydratedDocument } from 'mongoose';
	import type { BookProperties } from '$lib/properties/book';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import BookPreview from '../book/BookPreview.svelte';
	import ChapterPreview from '../chapter/ChapterPreview.svelte';
	import StorylinePreview from '../storyline/StorylinePreview.svelte';
	import { createEventDispatcher } from 'svelte';

	export let documentType: PermissionedDocument;
	export let documents: HydratedDocument<any>[];
	export let selectedID: string = documents.at(0)._id;

	let elemMovies: HTMLDivElement;

	function multiColumnLeft(): void {
		let x = elemMovies.scrollWidth;
		if (elemMovies.scrollLeft !== 0) x = elemMovies.scrollLeft - elemMovies.clientWidth;
		elemMovies.scroll(x, 0);
	}

	function multiColumnRight(): void {
		let x = 0;
		// -1 is used because different browsers use different methods to round scrollWidth pixels.
		if (elemMovies.scrollLeft < elemMovies.scrollWidth - elemMovies.clientWidth - 1)
			x = elemMovies.scrollLeft + elemMovies.clientWidth;
		elemMovies.scroll(x, 0);
	}

	const dispatch = createEventDispatcher();
	function handleSelected(event: { detail: any }) {
		selectedID = event.detail;
		dispatch('selectedStoryline', selectedID);
	}

	function bookItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<BookProperties>;
	}

	function storylineItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<StorylineProperties>;
	}

	function chapterItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<ChapterProperties>;
	}
</script>

<Section id="document-carousel" class="flex items-center w-full p-4">
	<div class="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
		<!-- Button: Left -->
		<button type="button" class="btn-icon variant-filled" on:click={multiColumnLeft}>
			<Icon data={arrowCircleLeft} />
		</button>
		<!-- Carousel -->
		<div
			bind:this={elemMovies}
			class="snap-x snap-mandatory scroll-smooth flex gap-2 pb-2 overflow-x-auto"
		>
			{#each documents as document}
				{#if documentType === 'Book'}
					<BookPreview book={bookItem(document)} />
				{:else if documentType === 'Storyline'}
					<StorylinePreview
						dispatchEvent={true}
						on:selectedStoryline={handleSelected}
						user={undefined}
						storyline={storylineItem(document)}
					/>
				{:else}
					<ChapterPreview chapter={chapterItem(document)} />
				{/if}
			{/each}
		</div>
		<!-- Button-Right -->
		<button type="button" class="btn-icon variant-filled" on:click={multiColumnRight}>
			<Icon data={arrowCircleRight} />
		</button>
	</div>
</Section>
