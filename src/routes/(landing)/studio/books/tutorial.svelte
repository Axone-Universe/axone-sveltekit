<script lang="ts">
	import type Shepherd from 'shepherd.js';
	import 'shepherd.js/dist/css/shepherd.css';
	import { onMount } from 'svelte';
	import { Icon } from 'svelte-awesome';
	import { info } from 'svelte-awesome/icons';
	import { back, complete, next, tour, getShepherdStep } from '$lib/util/tour/tour';

	onMount(() => {
		setupTour();
	});

	export function setupTour() {
		tour.addStep(
			getShepherdStep(
				'archive-toggle',
				'bottom',
				'Filter books by archived. Selecting this filter will return only archived books in the table.',
				[next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'campaigns-toggle',
				'bottom',
				'Filter books by campaigns. Selecting this filter will return books created as campaigns.',
				[back, next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'archive-btn',
				'bottom',
				'Archive the selected books. This becomes active only after selecting one or more books.',
				[back, next]
			)
		);

		/**
		 * Create book tour
		 */

		let stepOptions: Shepherd.Step.StepOptions = getShepherdStep(
			'create-book-btn',
			'bottom',
			'Create a new book. Give a title, description and genres of the book. Also set individual and public permissions for the book.',
			[back, next]
		);
		stepOptions.when = {
			show: () => {
				setupBookTour();
				document.getElementById('create-book-btn')?.click();
			}
		};
		tour.addStep(stepOptions);
	}

	function setupBookTour() {
		tour.addStep(getShepherdStep('book-title', 'bottom', 'Insert book title', [back, next]));

		tour.addStep(
			getShepherdStep('book-description', 'bottom', 'Insert book description', [back, next])
		);

		tour.addStep(
			getShepherdStep('image-uploader-div', 'bottom', 'Upload the book cover', [back, next])
		);

		tour.addStep(
			getShepherdStep('genres-div', 'bottom', 'Select book genres for readers to find your book', [
				back,
				next
			])
		);

		tour.addStep(
			getShepherdStep(
				'permission-users-input',
				'bottom',
				'Search for users to give permissions to your book',
				[back, next]
			)
		);

		tour.addStep(
			getShepherdStep(
				'public-permissions-btn',
				'bottom',
				'Set permissions for the public. <br>&#8226; View allows public viewing for your book. <br>&#8226; Collaborate allows the public to create new storylines for your book.',
				[back, next]
			)
		);
		let stepOptions: Shepherd.Step.StepOptions = getShepherdStep(
			'create-campaign-btn',
			'bottom',
			'Create a new campaign. A campaign allows authors to write different stories based on the premise of that campaign.',
			[back, next]
		);
		stepOptions.when = {
			show: () => {
				setupCampaignTour();
				document.getElementById('cancel-btn')?.click();
				document.getElementById('create-campaign-btn')?.click();
			}
		};
		tour.addStep(stepOptions);
	}

	function setupCampaignTour() {
		tour.addStep(
			getShepherdStep('start-date-input', 'bottom', 'Set the campaign start date', [back, next])
		);

		tour.addStep(
			getShepherdStep('end-date-input', 'bottom', 'Set the campaign end date', [back, next])
		);

		tour.addStep(
			getShepherdStep(
				'criteria-textarea',
				'bottom',
				'Set the eligibility criteria for your campaign',
				[back, next]
			)
		);

		tour.addStep(
			getShepherdStep('rewards-textarea', 'bottom', 'Set campaign rewards if any', [back, next])
		);

		tour.addStep(
			getShepherdStep(
				'permission-users-input',
				'bottom',
				'Search for users to give permissions to your book',
				[back, complete]
			)
		);
	}
</script>

<button class="fixed z-50 bottom-10 left-10 btn-icon variant-filled" on:click={() => tour.start()}>
	<Icon data={info} scale={1.5} />
</button>
