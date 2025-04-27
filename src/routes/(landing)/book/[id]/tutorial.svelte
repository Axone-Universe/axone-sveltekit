<script lang="ts">
	import 'shepherd.js/dist/css/shepherd.css';
	import { afterUpdate, onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		back,
		complete,
		next,
		getTour,
		getShepherdStep,
		autoStartTour,
		getBaseURL
	} from '$lib/util/tour/tour';

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
				'document-carousel',
				'bottom',
				`Select a storyline
					<ul class="list-disc">
						<li>For a book, a storyline is an alternative path or trajectory of the book.</li> 
						<li>For a campaign a storyline is a campaign story submission</li>
					</ul>`,
				[next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'read-btn',
				'bottom',
				'Open the reading page for currently selected storyline',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'join-btn',
				'bottom',
				'Join a campaign by creating a new story or submitting an existing one.',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'reading-list-btn',
				'bottom',
				'Add a storyline to your reading lists. View and manage reading lists from your library (top right corner dropdown).',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'edit-storyline-btn',
				'bottom',
				'Edit this storyline using the authors editing tool',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'share-btn',
				'bottom',
				'Share a link to this campaign with friends using various social media platforms!',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'create-storyline-btn',
				'bottom',
				'Create a new storyline from this chapter. The storyline will contain the previous chapters and next spin-off chapters can be created for the storyline.',
				[back(tour), complete(tour)]
			)
		);
	}
</script>
