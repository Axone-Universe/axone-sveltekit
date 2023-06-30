<script lang="ts">
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import type { EmblaPluginType, EmblaOptionsType, EmblaCarouselType } from 'embla-carousel-svelte';
	import Container from '$lib/components/Container.svelte';

	import Icon from 'svelte-awesome';
	import { arrowCircleRight, arrowCircleLeft } from 'svelte-awesome/icons';

	let emblaApi: EmblaCarouselType;

	export let options: EmblaOptionsType;
	export let plugins: EmblaPluginType[];

	const onInit = (evt: CustomEvent<EmblaCarouselType>) => {
		emblaApi = evt.detail;
	};

	const scrollNext = () => {
		emblaApi.scrollNext();
	};

	const scrollPrev = () => {
		emblaApi.scrollPrev();
	};
</script>

<Container class="flex items-center w-full p-4">
	<button class="embla__button embla__next" on:click={scrollPrev}>
		<Icon class="p-2" data={arrowCircleLeft} scale={3} />
	</button>
	<div
		class="embla overflow-hidden w-full m-4"
		use:emblaCarouselSvelte={{ options, plugins }}
		on:emblaInit={onInit}
	>
		<div class="flex gap-4 p-2">
			<slot />
		</div>
	</div>
	<button class="embla__button embla__prev" on:click={scrollNext}>
		<Icon class="p-2" data={arrowCircleRight} scale={3} />
	</button>
</Container>
