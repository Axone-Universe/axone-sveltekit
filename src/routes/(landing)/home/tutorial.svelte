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
				'search-input',
				'bottom',
				'Search for stories by title or hash-tags. The results will auto-load when you enter the title in the input.',
				[next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'filters-container',
				'bottom',
				'Filter for stories by criteria or genres.',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(tour, 'write-btn', 'bottom', 'Quick-start your writing journey!', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'email-btn',
				'bottom',
				'Manage your books, campaigns, library and profile.',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(tour, 'notifications-btn', 'bottom', 'View your notifications', [
				back(tour),
				complete(tour)
			])
		);
	}
</script>
