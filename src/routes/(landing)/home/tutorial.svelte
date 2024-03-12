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
				'search-input',
				'bottom',
				'Search for stories by title or hash-tags. The results will auto-load when you enter the title in the input.',
				[next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'filter-input',
				'bottom',
				'Filter search results by suggested tags or genre.',
				[back, next]
			)
		);

		tour.addStep(getShepherdStep('email-btn', 'bottom', 'Manage your account', [back, complete]));
	}
</script>
