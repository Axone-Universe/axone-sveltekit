<script lang="ts">
	import Shepherd from 'shepherd.js';
	import 'shepherd.js/dist/css/shepherd.css';
	import { onMount } from 'svelte';
	import { Icon } from 'svelte-awesome';
	import { info } from 'svelte-awesome/icons';
	import { back, complete, next, tour, getShepherdStep } from '$lib/util/tour/tour';

	onMount(() => {
		setupTour();
	});

	export function setupTour() {
		tour.addStep(
			getShepherdStep(
				'search-input',
				'bottom',
				'Search for books by title. The results will auto-load when you enter the title in the input.',
				[next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'accordion-control-filter-input',
				'bottom',
				'Filter search results by suggested tags or genre.',
				[back, complete]
			)
		);
	}
</script>

<button class="fixed z-50 bottom-10 right-10 btn-icon variant-filled" on:click={() => tour.start()}>
	<Icon data={info} scale={1.5} />
</button>
