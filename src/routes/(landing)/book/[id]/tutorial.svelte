<script lang="ts">
	import 'shepherd.js/dist/css/shepherd.css';
	import { afterUpdate, onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		back,
		complete,
		next,
		tour,
		getShepherdStep,
		autoStartTour,
		getBaseURL
	} from '$lib/util/tour/tour';

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
