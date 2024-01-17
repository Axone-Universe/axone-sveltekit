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
				'archive-toggle',
				'bottom',
				'Filter storylines by archived. Selecting this filter will return only archived storylines in the list.',
				[next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'archive-btn',
				'bottom',
				'Archive the selected storylines. This becomes active only after selecting one or more storylines.',
				[back, next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'row-actions-btn',
				'bottom',
				'Manage the storyline details or delete the storyline.',
				[back, complete]
			)
		);
	}
</script>

<button class="fixed z-50 bottom-10 left-10 btn-icon variant-filled" on:click={() => tour.start()}>
	<Icon data={info} scale={1.5} />
</button>
