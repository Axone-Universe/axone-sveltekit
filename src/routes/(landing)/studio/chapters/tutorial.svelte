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
				'archive-toggle',
				'bottom',
				'Filter chapters by archived. Selecting this filter will return only archived chapters in the list.',
				[next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'archive-btn',
				'bottom',
				'Archive the selected chapters. This becomes active only after selecting one or more chapters.',
				[back, next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'row-actions-btn',
				'bottom',
				'Manage the chapter details or delete the chapter.',
				[back, complete]
			)
		);
	}
</script>

<button class="fixed z-50 bottom-10 left-10 btn-icon variant-filled" on:click={() => tour.start()}>
	<Icon data={info} scale={1.5} />
</button>
