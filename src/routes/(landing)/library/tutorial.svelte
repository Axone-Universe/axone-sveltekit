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
				'reading-list-select',
				'right',
				'Select a reading list to view saved stories.',
				[next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'create-reading-list',
				'right',
				"Create a new reading list. For example, you can create a 'Romance' reading list.",
				[back(tour), complete(tour)]
			)
		);
	}
</script>
