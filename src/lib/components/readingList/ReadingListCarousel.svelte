<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { chevronRight, chevronLeft } from 'svelte-awesome/icons';
	import StorylinePreview from '../storyline/StorylinePreview.svelte';
	import type { HydratedDocument } from 'mongoose';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import type { BookProperties } from '$lib/properties/book';
	import type { UserProperties } from '$lib/properties/user';
	import { getModalStore, type ModalComponent, type ModalSettings } from '@skeletonlabs/skeleton';
	import ReadingListDetailModal from './ReadingListDetailModal.svelte';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';

	export let readingLists: {
		name: string;
		storylineIds: string[];
		curatorId: string;
		curatorName: string;
		curatorImageURL?: string;
	}[] = [];
	export let storylines: HydratedDocument<StorylineProperties>[] = [];
	export let user: any = undefined;
	export let supabase: any = undefined;

	let customClass = '';
	export { customClass as class };

	const modalStore = getModalStore();
	let elemDocuments: HTMLDivElement;
	let currentIndex = 0;
	let isMobile = false;

	// Reading lists that have at least one storyline (visible slides)
	$: visibleLists = readingLists.filter((list) => getStorylineForList(list));

	onMount(() => {
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

	// On mobile we show 2 items per "page"; one page = one viewport width
	$: mobilePageCount = Math.ceil(visibleLists.length / 2);
	$: dotIndices = Array.from({ length: mobilePageCount }, (_, i) => i);

	function goToSlide(index: number): void {
		if (!elemDocuments) return;
		if (isMobile) {
			const pageWidth = elemDocuments.clientWidth;
			elemDocuments.scroll({ left: pageWidth * index, behavior: 'smooth' });
		}
	}

	function handleScroll(): void {
		if (!elemDocuments) return;
		if (isMobile && mobilePageCount > 0) {
			const pageWidth = elemDocuments.clientWidth;
			const newIndex = Math.round(elemDocuments.scrollLeft / pageWidth);
			if (newIndex >= 0 && newIndex < mobilePageCount) {
				currentIndex = newIndex;
			}
		}
	}

	// Get the first storyline for each reading list
	function getStorylineForList(list: {
		name: string;
		storylineIds: string[];
		curatorId: string;
		curatorName: string;
		curatorImageURL?: string;
	}) {
		const firstStorylineId = list.storylineIds[0];
		return storylines.find((s) => s._id.toString() === firstStorylineId);
	}

	// Open modal with all storylines in the reading list
	async function openReadingListModal(list: {
		name: string;
		storylineIds: string[];
		curatorId: string;
		curatorName: string;
		curatorImageURL?: string;
	}) {
		try {
			// Fetch all storylines for this reading list
			const response = await trpc($page).storylines.getByIds.query({
				ids: list.storylineIds
			});

			if (response.success && response.data) {
				const modalComponent: ModalComponent = {
					ref: ReadingListDetailModal,
					props: {
						readingListName: list.name,
						storylines: response.data,
						user: user,
						supabase: supabase
					}
				};

				const modal: ModalSettings = {
					type: 'component',
					component: modalComponent
				};

				modalStore.trigger(modal);
			}
		} catch (error) {
			console.error('Error fetching reading list storylines:', error);
		}
	}
</script>

<Section id="reading-list-carousel" class="{customClass} flex items-center w-full md:p-4">
	<div class="flex flex-col gap-4 w-full">
		<div class="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center w-full">
			<!-- Button: Left (hidden on mobile, dots used instead) -->
			<button
				type="button"
				on:click={multiColumnLeft}
				class="hidden md:flex"
				aria-label="Scroll left"
			>
				<Icon data={chevronLeft} scale={1.3} />
			</button>
			<!-- Carousel -->
			<div
				bind:this={elemDocuments}
				on:scroll={handleScroll}
				class="snap-x snap-mandatory scroll-smooth flex gap-4 pb-2 overflow-x-auto scrollbar-hide"
			>
				{#each readingLists as list}
					{@const storyline = getStorylineForList(list)}
					{#if storyline}
						<button
							class="shrink-0 w-[calc(50%-8px)] md:w-[18%] snap-start cursor-pointer min-w-0"
							on:click={() => openReadingListModal(list)}
							type="button"
						>
						<div class="relative hover:scale-105 transition-transform duration-200">
							<!-- Storyline Preview -->
							<div class="pointer-events-none">
								<StorylinePreview
									{storyline}
									{user}
									{supabase}
									dispatchEvent={false}
									onUpdate={() => {}}
								/>
							</div>
							<!-- Reading List Info Overlay -->
							<div
								class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 rounded-b-md"
							>
								<div class="flex items-start gap-2">
									{#if list.curatorImageURL}
										<div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
											<ImageWithFallback
												src={list.curatorImageURL}
												alt={list.curatorName}
												class="w-full h-full object-cover"
											/>
										</div>
									{/if}
									<div class="flex-1 min-w-0 text-left">
										<p class="text-white font-bold text-sm line-clamp-1">{list.name}</p>
										<p class="text-white/80 text-xs line-clamp-1">
											by {list.curatorName}
										</p>
										<p class="text-white/60 text-xs mt-1">
											{list.storylineIds.length}
											{list.storylineIds.length === 1 ? 'storyline' : 'storylines'}
										</p>
									</div>
								</div>
							</div>
						</div>
					</button>
				{/if}
			{/each}
		</div>
		<!-- Button-Right (hidden on mobile) -->
		<button
			type="button"
			class="hidden md:flex h-full"
			on:click={multiColumnRight}
			aria-label="Scroll right"
		>
			<Icon data={chevronRight} scale={1.3} />
		</button>
		</div>

		<!-- Dot navigation (mobile only; one dot per page of 2 items) -->
		<div class="flex md:hidden justify-center gap-2">
			{#each dotIndices as index}
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
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
