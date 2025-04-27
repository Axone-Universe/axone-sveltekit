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
			getShepherdStep(tour, 'storylines-list', 'bottom', 'Title of your new storyline.', [
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'chapters-list',
				'bottom',
				'Inherited chapters from the parent storyline.',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(tour, 'storyline-title', 'bottom', 'Insert storyline title', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(tour, 'storyline-description', 'bottom', 'Insert storyline description', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(tour, 'image-uploader-div', 'bottom', 'Upload the storyline cover', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'permission-users-input',
				'bottom',
				'Search for users to give permissions to your book',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'public-permissions-btn',
				'bottom',
				'Set permissions for the public. <br>&#8226; View allows public viewing for your storyline. <br>&#8226; Collaborate allows the public to create new chapters for your storyline.',
				[back(tour), complete(tour)]
			)
		);
	}
</script>
