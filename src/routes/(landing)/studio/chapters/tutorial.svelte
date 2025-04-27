<script lang="ts">
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
				'Filter chapters by archived. Selecting this filter will return only archived chapters in the list.',
				[next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'archive-btn',
				'bottom',
				'Archive the selected chapters. This becomes active only after selecting one or more chapters.',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'row-actions-btn',
				'bottom',
				'Manage the chapter details or delete the chapter.',
				[back(tour), complete(tour)]
			)
		);
	}
</script>
