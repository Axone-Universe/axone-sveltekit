<script lang="ts">
	import Shepherd from 'shepherd.js';
	import 'shepherd.js/dist/css/shepherd.css';
	import { afterUpdate, onMount } from 'svelte';
	import {
		back,
		complete,
		next,
		getTour,
		getShepherdStep,
		autoStartTour,
		getBaseURL
	} from '$lib/util/tour/tour';
	import { page } from '$app/stores';

	const tour = getTour();

	onMount(() => {
		setupTour();
	});

	afterUpdate(() => {
		const baseURL = getBaseURL($page);
		autoStartTour(tour, baseURL + '-tour');
	});

	export function setupTour() {
		tour.addStep(
			getShepherdStep(
				tour,
				'archive-toggle',
				'bottom',
				'Filter storylines by archived. Selecting this filter will return only archived storylines in the list.',
				[next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'archive-btn',
				'bottom',
				'Archive the selected storylines. This becomes active only after selecting one or more storylines.',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'row-actions-btn',
				'bottom',
				'Manage the storyline details or delete the storyline.',
				[back(tour), complete(tour)]
			)
		);
	}
</script>
