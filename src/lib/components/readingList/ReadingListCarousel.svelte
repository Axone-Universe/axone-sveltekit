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
	<div class="grid grid-cols-[auto_1fr_auto] gap-4 items-center w-full">
		<!-- Button: Left -->
		<button type="button" on:click={multiColumnLeft} aria-label="Scroll left">
			<Icon data={chevronLeft} scale={1.3} />
		</button>
		<!-- Carousel -->
		<div
			bind:this={elemDocuments}
			class="snap-x snap-mandatory scroll-smooth flex gap-4 pb-2 overflow-x-auto"
		>
			{#each readingLists as list}
				{@const storyline = getStorylineForList(list)}
				{#if storyline}
					<button
						class="shrink-0 w-[40%] md:w-[18%] snap-start cursor-pointer"
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
		<!-- Button-Right -->
		<button type="button" class="h-full" on:click={multiColumnRight} aria-label="Scroll right">
			<Icon data={chevronRight} scale={1.3} />
		</button>
	</div>
</Section>
