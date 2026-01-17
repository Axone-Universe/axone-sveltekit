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
	import { createEventDispatcher, onMount } from 'svelte';
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
	let currentIndex = 0;
	let isMobile = false;

	onMount(() => {
		// Check if mobile on mount and on resize
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	function multiColumnLeft(): void {
		if (!elemDocuments) return;
		let x = elemDocuments.scrollWidth;
		if (elemDocuments.scrollLeft !== 0) x = elemDocuments.scrollLeft - elemDocuments.clientWidth;
		elemDocuments.scroll({ left: x, behavior: 'smooth' });
	}

	function multiColumnRight(): void {
		if (!elemDocuments) return;
		let x = 0;
		// -1 is used because different browsers use different methods to round scrollWidth pixels.
		if (elemDocuments.scrollLeft < elemDocuments.scrollWidth - elemDocuments.clientWidth - 1)
			x = elemDocuments.scrollLeft + elemDocuments.clientWidth;
		elemDocuments.scroll({ left: x, behavior: 'smooth' });
	}

	function goToSlide(index: number): void {
		if (!elemDocuments) return;

		if (isMobile) {
			// On mobile, each dot represents one document (full width)
			const slideWidth = elemDocuments.clientWidth;
			elemDocuments.scroll({ left: slideWidth * index, behavior: 'smooth' });
		} else {
			// On desktop, scroll to show the selected document
			// Use the viewPort prop to determine item width
			const containerWidth = elemDocuments.clientWidth;
			const isLg = window.innerWidth >= 1024;
			// Default to 28% on md, adjust based on viewPort if needed
			const itemWidthPercent = viewPort.includes('w-[28%]') ? 0.28 : 0.3;
			const itemWidth = containerWidth * itemWidthPercent;
			const gap = 8; // gap-2 = 8px
			const scrollPosition = index * (itemWidth + gap);
			elemDocuments.scroll({ left: scrollPosition, behavior: 'smooth' });
		}
	}

	// Auto-update currentIndex when user manually scrolls
	function handleScroll(): void {
		if (!elemDocuments) return;

		if (isMobile) {
			// On mobile, each item is full width
			const slideWidth = elemDocuments.clientWidth;
			const newIndex = Math.round(elemDocuments.scrollLeft / slideWidth);
			if (newIndex !== currentIndex && newIndex >= 0 && newIndex < localDocuments.length) {
				currentIndex = newIndex;
			}
		} else {
			// On desktop, find which document is most visible
			const containerWidth = elemDocuments.clientWidth;
			const itemWidthPercent = viewPort.includes('w-[28%]') ? 0.28 : 0.3;
			const itemWidth = containerWidth * itemWidthPercent;
			const gap = 8;
			const scrollPosition = elemDocuments.scrollLeft;
			const newIndex = Math.round(scrollPosition / (itemWidth + gap));
			if (newIndex !== currentIndex && newIndex >= 0 && newIndex < localDocuments.length) {
				currentIndex = newIndex;
			}
		}
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

<Section id="document-carousel" class="{customClass} w-full md:p-4">
	<div class="flex flex-col gap-6">
		<div class="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center">
			<!-- Button: Left -->
			<button
				type="button"
				on:click={multiColumnLeft}
				class="hidden md:flex btn-icon variant-filled-primary"
				aria-label="Scroll left"
			>
				<Icon data={chevronLeft} scale={1.3} />
			</button>
			<!-- Carousel -->
			<div
				bind:this={elemDocuments}
				on:scroll={handleScroll}
				class="snap-x snap-mandatory scroll-smooth flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide"
			>
				{#each localDocuments as document}
					<div class="shrink-0 w-full {viewPort} snap-start">
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
			<button
				type="button"
				on:click={multiColumnRight}
				class="hidden md:flex btn-icon variant-filled-primary"
				aria-label="Scroll right"
			>
				<Icon data={chevronRight} scale={1.3} />
			</button>
		</div>

		<!-- Dot Navigation -->
		<div class="flex justify-center gap-2">
			{#each localDocuments as _, index}
				<button
					type="button"
					on:click={() => goToSlide(index)}
					class="w-3 h-3 rounded-full transition-all duration-300 {currentIndex === index
						? 'bg-primary-500 w-8'
						: 'bg-surface-400-500-token hover:bg-surface-500-400-token'}"
					aria-label="Go to slide {index + 1}"
				/>
			{/each}
		</div>
	</div>
</Section>

<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
