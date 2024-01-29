<script lang="ts">
	import Shepherd from 'shepherd.js';
	import 'shepherd.js/dist/css/shepherd.css';
	import { onMount } from 'svelte';
	import { Icon } from 'svelte-awesome';
	import { info } from 'svelte-awesome/icons';
	import { back, complete, next, tour, getShepherdStep, autoStartTour } from '$lib/util/tour/tour';
	import { page } from '$app/stores';

	onMount(() => {
		setupTour();
		autoStartTour($page.url + '-tour');
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
