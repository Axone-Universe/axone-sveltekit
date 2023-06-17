<script lang="ts">
	import type { EmblaOptionsType } from 'embla-carousel-svelte';

	import Section from '$lib/components/Section.svelte';
	import BookPreview from '$lib/components/book/BookPreview.svelte';
	import BookCarousel from '$lib/components/carousel/BookCarousel.svelte';

	import type { PageData } from './$types';

	export let data: PageData;
	let { userAuthoredBookResponses } = data;

	let options: EmblaOptionsType = {
		loop: false,
		align: 'start',
		slidesToScroll: 1
	};
	let plugins: never[] = [];
</script>

<Section>
	<div class="mx-20 xl:mx-40 md:space-y-2">
		<p class="text-l md:text-3xl font-bold">Featured</p>
		<p class="text-sm text-thin md:text-normal">Our top picks from the universe</p>
	</div>
	<BookCarousel {options} {plugins}>
		{#each userAuthoredBookResponses as bookResponse}
			<BookPreview class="embla__slide" bookData={bookResponse} />
		{/each}
	</BookCarousel>
</Section>

<Section>
	<div class="mx-20 xl:mx-40 md:space-y-2">
		<p class="text-l md:text-3xl font-bold">Top Finds For You</p>
	</div>
	<BookCarousel {options} {plugins}>
		{#each userAuthoredBookResponses as bookResponse}
			<BookPreview class="embla__slide" bookData={bookResponse} />
		{/each}
	</BookCarousel>
</Section>
