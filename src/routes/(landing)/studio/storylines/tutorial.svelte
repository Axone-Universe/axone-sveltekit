<script lang="ts">
	import Shepherd from 'shepherd.js';
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
