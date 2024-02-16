<script lang="ts">
	import 'shepherd.js/dist/css/shepherd.css';
	import { afterUpdate, onMount } from 'svelte';
	import {
		back,
		complete,
		next,
		tour,
		getShepherdStep,
		autoStartTour,
		getBaseURL
	} from '$lib/util/tour/tour';
	import { page } from '$app/stores';

	onMount(() => {
		setupTour();
	});

	afterUpdate(() => {
		const baseURL = getBaseURL($page);
		autoStartTour(baseURL + '-tour');
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
