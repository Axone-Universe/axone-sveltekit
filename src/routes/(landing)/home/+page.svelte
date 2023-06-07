<script lang="ts">
	import type { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel-svelte';

	import Section from '$lib/components/Section.svelte';
	import BookPreview from '$lib/components/book/BookPreview.svelte';
	import BookCarousel from '$lib/components/carousel/BookCarousel.svelte';

	import type { PageData } from './$types';

	export let data: PageData;
	let { userAuthoredBookResponses } = data;

	let options: EmblaOptionsType = {
		loop: false,
		align: 'start',
		slidesToScroll: 2
	};
	let plugins: never[] = [];
</script>

<Section class="m-10">
	<div class="mx-40 space-y-2">
		<p class="text-3xl font-bold">Featured</p>
		<p class="text-thin">Our top picks from the universe</p>
	</div>
	<BookCarousel {options} {plugins}>
		{#each userAuthoredBookResponses as bookResponse}
			<BookPreview class="embla__slide flex-[0_0_20%]" bookData={bookResponse} />
		{/each}
	</BookCarousel>
</Section>

<Section class="m-10">
	<div class="mx-40">
		<p class="text-3xl font-bold">Top Finds For You</p>
	</div>
	<BookCarousel {options} {plugins}>
		{#each userAuthoredBookResponses as bookResponse}
			<BookPreview class="embla__slide flex-[0_0_20%]" bookData={bookResponse} />
		{/each}
	</BookCarousel>
</Section>
