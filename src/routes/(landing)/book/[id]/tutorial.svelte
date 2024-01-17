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
				'document-carousel',
				'bottom',
				'Select a storyline. A Storyline is an alternative path or trajectory of the story.',
				[next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'reading-list-btn',
				'bottom',
				'Add a storyline to your reading lists. View and manage reading lists from your library (top right corner dropdown).',
				[back, next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'create-storyline-btn',
				'bottom',
				'Create a new storyline from this chapter. The storyline will contain the previous chapters and next spin-off chapters can be created for the storyline.',
				[back, complete]
			)
		);
	}
</script>

<button class="fixed z-50 bottom-10 right-10 btn-icon variant-filled" on:click={() => tour.start()}>
	<Icon data={info} scale={1.5} />
</button>
