<script lang="ts">
	import Section from '$lib/components/Section.svelte';

	import Icon from 'svelte-awesome/components/Icon.svelte';
	import {
		arrowCircleRight,
		arrowCircleLeft,
		chevronRight,
		chevronLeft
	} from 'svelte-awesome/icons';
	import type { PermissionedDocument } from '$lib/properties/permission';
	import type { HydratedDocument } from 'mongoose';
	import type { BookProperties } from '$lib/properties/book';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import BookPreview from '../book/BookPreview.svelte';
	import ChapterPreview from '../chapter/ChapterPreview.svelte';
	import StorylinePreview from '../storyline/StorylinePreview.svelte';
	import { createEventDispatcher } from 'svelte';
	import UserPreview from '../user/UserPreview.svelte';
	import type { UserProperties } from '$lib/properties/user';
	import { getModalStore } from '@skeletonlabs/skeleton';

	export let documentType: PermissionedDocument | 'User';
	export let documents: HydratedDocument<any>[];
	export let selectedID: string = documents.at(0)._id;
	export let viewPort: string = 'w-[70%] md:w-[28%]';
	export let user: any = undefined;
	export let supabase: any = undefined;

	let customClass = '';
	export { customClass as class };

	// Local copy of documents for reactivity
	let localDocuments = documents;
	$: localDocuments = documents;

	let elemDocuments: HTMLDivElement;

	function multiColumnLeft(): void {
		let x = elemDocuments.scrollWidth;
		if (elemDocuments.scrollLeft !== 0) x = elemDocuments.scrollLeft - elemDocuments.clientWidth;
		elemDocuments.scroll(x, 0);
	}

	function multiColumnRight(): void {
		let x = 0;
		// -1 is used because different browsers use different methods to round scrollWidth pixels.
		if (elemDocuments.scrollLeft < elemDocuments.scrollWidth - elemDocuments.clientWidth - 1)
			x = elemDocuments.scrollLeft + elemDocuments.clientWidth;
		elemDocuments.scroll(x, 0);
	}

	const dispatch = createEventDispatcher();
	function handleSelected(event: { detail: any }) {
		selectedID = event.detail;
		dispatch('selectedStoryline', selectedID);

		// if the carousel was opened as a modal
		if ($modalStore[0]) {
			$modalStore[0].response ? $modalStore[0].response(selectedID) : '';
		}
		modalStore.close();
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

	function userItem(item: HydratedDocument<unknown>) {
		return item as unknown as HydratedDocument<UserProperties>;
	}

	function handleStorylineDeleted(deletedStorylineId: string) {
		// Filter out the deleted storyline and trigger reactivity
		localDocuments = localDocuments.filter((doc) => doc._id.toString() !== deletedStorylineId);
		// Also close the modal if open
		if ($modalStore[0]) {
			modalStore.close();
		}
	}

	const modalStore = getModalStore();
</script>

<Section id="document-carousel" class="{customClass} flex items-center w-full md:p-4">
	<div class="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
		<!-- Button: Left -->
		<button type="button" on:click={multiColumnLeft}>
			<Icon data={chevronLeft} scale={1.3} />
		</button>
		<!-- Carousel -->
		<div
			bind:this={elemDocuments}
			class="snap-x snap-mandatory scroll-smooth flex gap-2 pb-2 overflow-x-auto"
		>
			{#each localDocuments as document}
				<div class="shrink-0 {viewPort} snap-start">
					{#if documentType === 'Book'}
						<BookPreview book={bookItem(document)} />
					{:else if documentType === 'Storyline'}
						<StorylinePreview
							dispatchEvent={true}
							on:selectedStoryline={handleSelected}
							{user}
							{supabase}
							storyline={storylineItem(document)}
							onUpdate={() => handleStorylineDeleted(document._id.toString())}
						/>
					{:else if documentType === 'Chapter'}
						<ChapterPreview chapter={chapterItem(document)} />
					{:else}
						<UserPreview user={userItem(document)} />
					{/if}
				</div>
			{/each}
		</div>
		<!-- Button-Right -->
		<button type="button" class="h-full" on:click={multiColumnRight}>
			<Icon data={chevronRight} scale={1.3} />
		</button>
	</div>
</Section>
