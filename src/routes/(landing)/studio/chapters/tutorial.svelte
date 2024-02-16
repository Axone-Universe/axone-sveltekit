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
