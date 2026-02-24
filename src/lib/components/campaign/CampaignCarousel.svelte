<script lang="ts">
	import ImageWithFallback from '$lib/components/util/ImageWithFallback.svelte';
	import { type HydratedCampaignProperties } from '$lib/properties/campaign';
	import { type HydratedDocument } from 'mongoose';

	export let campaigns: HydratedDocument<HydratedCampaignProperties>[];

	let currentIndex = 0;
	let carouselContainer: HTMLDivElement;

	function goToSlide(index: number): void {
		currentIndex = index;
		const slideWidth = carouselContainer.clientWidth;
		carouselContainer.scroll({ left: slideWidth * index, behavior: 'smooth' });
	}

	// Auto-update currentIndex when user manually scrolls
	function handleScroll(): void {
		const slideWidth = carouselContainer.clientWidth;
		const newIndex = Math.round(carouselContainer.scrollLeft / slideWidth);
		if (newIndex !== currentIndex) {
			currentIndex = newIndex;
		}
	}
</script>

<div class="space-y-6">
	<div class="mb-6">
		<h2 class="text-2xl md:text-3xl font-bold mb-2">Active Writing Competitions</h2>
		<p class="text-lg text-surface-700-200-token">
			Join our current campaigns and showcase your talent
		</p>
	</div>

	<!-- Carousel Container -->
	<div
		bind:this={carouselContainer}
		on:scroll={handleScroll}
		class="snap-x snap-mandatory scroll-smooth flex overflow-x-auto scrollbar-hide"
	>
		{#each campaigns as campaign}
			<div class="shrink-0 w-full snap-start">
				<div
					class="relative rounded-lg overflow-hidden min-h-[320px] md:min-h-[400px] flex flex-col justify-center"
				>
					<!-- Right 50%: solid background -->
					<div
						class="absolute right-0 top-0 bottom-0 w-1/2 bg-surface-50 dark:bg-surface-900"
						aria-hidden="true"
					/>
					<!-- Left 50%: image (full height), blends to the right -->
					<div class="campaign-image-wrap absolute left-0 top-0 bottom-0 w-1/2">
						<ImageWithFallback
							src={campaign.book.imageURL}
							alt={campaign.book.title ?? 'Campaign'}
							class="w-full h-full object-cover"
						/>
					</div>
					<!-- Overlay on image area so text is readable when it overlays the image -->
					<div
						class="absolute left-0 top-0 bottom-0 w-1/2 z-[1] bg-gradient-to-r from-black/50 to-transparent pointer-events-none"
						aria-hidden="true"
					/>
					<!-- Content -->
					<div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 md:p-10">
						<div class="hidden md:block" />
						<div class="flex flex-col space-y-6 text-center md:text-right">
							<div class="space-y-4">
								<h3 class="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
									{campaign.book.title}
								</h3>
								<p class="text-base md:text-lg text-surface-600-300-token line-clamp-5">
									{campaign.book.description}
								</p>
							</div>
							<div class="flex justify-center md:justify-end">
								<a
									href="./book/{campaign.book._id}"
									class="btn variant-filled-primary btn-lg text-lg px-8 py-4 inline-flex items-center gap-2"
								>
									<span>Join Competition</span>
									<i class="fa-solid fa-arrow-right" />
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Dot Navigation -->
	<div class="flex justify-center gap-2 mt-6">
		{#each campaigns as _, index}
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

<style>
	.campaign-image-wrap {
		-webkit-mask-image: linear-gradient(to right, black 0%, black 60%, transparent 100%);
		mask-image: linear-gradient(to right, black 0%, black 60%, transparent 100%);
		-webkit-mask-size: 100% 100%;
		mask-size: 100% 100%;
		-webkit-mask-repeat: no-repeat;
		mask-repeat: no-repeat;
	}
</style>
