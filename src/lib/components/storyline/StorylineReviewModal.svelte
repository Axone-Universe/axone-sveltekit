<script lang="ts">
	import type { StorylineProperties } from '$lib/properties/storyline';
	import { modalStore, toastStore, type ToastSettings, Ratings } from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { Icon } from 'svelte-awesome';
	import { star, starHalfO, starO } from 'svelte-awesome/icons';

	export let storyline: HydratedDocument<StorylineProperties>;

	let customClass = '';
	export { customClass as class };

	let closeModal = () => {
		modalStore.close();
	};

	let value = { current: 1, max: 5 };

	function iconClick(event: CustomEvent<{ index: number }>): void {
		value.current = event.detail.index;
	}

	async function reviewStoryline() {
		let toastMessage = 'Creation Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.reviews.create.mutate({
				item: storyline._id,
				reviewOf: 'Storyline',
				rating: value.current
			})
			.then((response) => {
				storyline = response.data as HydratedDocument<StorylineProperties>;
				toastMessage = 'Thank you for rating!';
				toastBackground = 'bg-success-500';
			})
			.catch((response) => {
				if (response.message.includes('E11000')) {
					toastMessage = 'Review already submitted';
				} else {
					toastMessage = response.data.message || response.message;
				}
			})
			.finally(() => {
				let t: ToastSettings = {
					message: toastMessage,
					background: toastBackground,
					autohide: true
				};
				toastStore.trigger(t);
				modalStore.close();
			});
	}
</script>

<form
	on:submit|preventDefault={reviewStoryline}
	class={`modal-example-form card p-4 w-modal h-fit shadow-xl space-y-4 overflow-y-auto ${customClass}`}
>
	<div class="flex flex-col modal-form p-4 space-y-4 rounded-container-token items-center">
		<header class="modal-header text-2xl font-bold">Rating for {storyline.title}</header>
		<p class="tracking-wide leading-8">
			<i>Your feedback helps fellow readers and authors as well.</i>
		</p>
		<Ratings bind:value={value.current} max={value.max} interactive on:icon={iconClick}>
			<svelte:fragment slot="empty">
				<Icon class="p-2" data={starO} scale={3} />
			</svelte:fragment>
			<svelte:fragment slot="half">
				<Icon class="p-2" data={starHalfO} scale={3} />
			</svelte:fragment>
			<svelte:fragment slot="full">
				<Icon class="p-2" data={star} scale={3} />
			</svelte:fragment>
		</Ratings>
	</div>
	<footer class="modal-footer flex justify-end space-x-2">
		<button on:click={closeModal} class="btn variant-ghost-surface" type="button">Cancel</button>
		<button class="btn variant-filled" type="submit">Submit</button>
	</footer>
</form>
