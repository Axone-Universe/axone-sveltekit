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
			getShepherdStep(tour, 'title', 'bottom', 'Insert book title', [back(tour), next(tour)])
		);

		tour.addStep(
			getShepherdStep(tour, 'description', 'bottom', 'Insert book description', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(tour, 'image-uploader-div', 'bottom', 'Upload the book cover', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'genres-div',
				'bottom',
				'Select book genres for readers to find your book',
				[back(tour), next(tour)]
			)
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
				`Set permissions for the public. 
				<ul class="list-disc">
					<li>View allows public viewing for your book.</li> 
					<li>Collaborate allows the public to create new storylines for your book.</li> 
				</ul>`,
				[back(tour), complete(tour)]
			)
		);
	}
</script>
