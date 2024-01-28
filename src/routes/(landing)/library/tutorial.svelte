<script lang="ts">
	import Shepherd from 'shepherd.js';
	import 'shepherd.js/dist/css/shepherd.css';
	import { afterUpdate, onMount } from 'svelte';
	import { Icon } from 'svelte-awesome';
	import { info } from 'svelte-awesome/icons';
	import { back, complete, next, tour, getShepherdStep, autoStartTour } from '$lib/util/tour/tour';
	import { page } from '$app/stores';

	onMount(() => {
		setupTour();
	});

	afterUpdate(() => {
		autoStartTour($page.url + '-tour');
	});

	export function setupTour() {
		tour.addStep(
			getShepherdStep(
				'reading-list-select',
				'right',
				'Select a reading list to view saved stories.',
				[next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'create-reading-list',
				'right',
				"Create a new reading list. For example, you can create a 'Romance' reading list.",
				[back, complete]
			)
		);
	}
</script>

<button class="fixed z-50 bottom-10 right-10 btn-icon variant-filled" on:click={() => tour.start()}>
	<Icon data={info} scale={1.5} />
</button>
