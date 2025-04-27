<script lang="ts">
	import type Shepherd from 'shepherd.js';
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
				'archive-toggle',
				'bottom',
				'Filter books/campaigns by archived. Selecting this filter will return only archived books/campaigns in the table.',
				[next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'archive-btn',
				'bottom',
				'After selecting books/campaigns, archive the selected books/campaigns.',
				[back(tour), next(tour)]
			)
		);

		/**
		 * Create book tour
		 */
		let stepOptions: Shepherd.Step.StepOptions = getShepherdStep(
			tour,
			'create-btn',
			'bottom',
			'Create a new book/campaign. Give a title, description and genres of the book/campaign. Also set individual and public permissions for the book/campaign.',
			[back(tour), next(tour)]
		);
		stepOptions.when = {
			show: () => {
				setupBookTour();
				document.getElementById('create-btn')?.click();
			}
		};
		tour.addStep(stepOptions);
	}

	function setupBookTour() {
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
			getShepherdStep(tour, 'image-uploader-div', 'bottom', 'Upload the book/campaign cover', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'genres-div',
				'bottom',
				'Select genres for readers to find your book/campaign',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(tour, 'tags-div', 'bottom', 'Insert tags for you book/campaign', [
				back(tour),
				next(tour)
			])
		);

		/**--------------------------------------*/
		// for campaigns
		tour.addStep(
			getShepherdStep(tour, 'start-date-input', 'bottom', 'Set the campaign start date', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(tour, 'end-date-input', 'bottom', 'Set the campaign end date', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'criteria-textarea',
				'bottom',
				'Set the eligibility criteria for your campaign',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(tour, 'rewards-textarea', 'bottom', 'Set campaign rewards if any', [
				back(tour),
				complete(tour)
			])
		);

		/*------------------------------------*/

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
				'Set permissions for the public.  <br>&#8226; View allows public viewing for your book. <br>&#8226; Collaborate allows the public to create new storylines for your book.',
				[back(tour), complete(tour)]
			)
		);
	}

	function setupCampaignTour() {
		tour.addStep(
			getShepherdStep(tour, 'start-date-input', 'bottom', 'Set the campaign start date', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(tour, 'end-date-input', 'bottom', 'Set the campaign end date', [
				back(tour),
				next(tour)
			])
		);

		tour.addStep(
			getShepherdStep(
				tour,
				'criteria-textarea',
				'bottom',
				'Set the eligibility criteria for your campaign',
				[back(tour), next(tour)]
			)
		);

		tour.addStep(
			getShepherdStep(tour, 'rewards-textarea', 'bottom', 'Set campaign rewards if any', [
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
				[back(tour), complete(tour)]
			)
		);
	}
</script>
