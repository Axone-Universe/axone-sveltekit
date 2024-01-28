<script lang="ts">
	import type Shepherd from 'shepherd.js';
	import 'shepherd.js/dist/css/shepherd.css';
	import { afterUpdate, onMount } from 'svelte';
	import { Icon } from 'svelte-awesome';
	import { info } from 'svelte-awesome/icons';
	import { back, complete, next, tour, getShepherdStep, autoStartTour } from '$lib/util/tour/tour';
	import { page } from '$app/stores';

	onMount(() => {
		setupTour();
	});

	afterUpdate(() => {
		autoStartTour($page.url + '-tour');
	});

	export function setupTour() {
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
				[back, complete]
			)
		);
	}
</script>

<button class="fixed z-50 bottom-10 right-10 btn-icon variant-filled" on:click={() => tour.start()}>
	<Icon data={info} scale={1.5} />
</button>
