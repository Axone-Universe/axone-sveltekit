<script lang="ts">
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
			getShepherdStep('storylines-list', 'bottom', 'Title of your new storyline.', [next])
		);

		tour.addStep(
			getShepherdStep('chapters-list', 'bottom', 'Inherited chapters from the parent storyline.', [
				back,
				next
			])
		);

		tour.addStep(
			getShepherdStep('storyline-title', 'bottom', 'Insert storyline title', [back, next])
		);

		tour.addStep(
			getShepherdStep('storyline-description', 'bottom', 'Insert storyline description', [
				back,
				next
			])
		);

		tour.addStep(
			getShepherdStep('image-uploader-div', 'bottom', 'Upload the storyline cover', [back, next])
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
				'Set permissions for the public. <br>&#8226; View allows public viewing for your storyline. <br>&#8226; Collaborate allows the public to create new chapters for your storyline.',
				[back, complete]
			)
		);
	}
</script>
