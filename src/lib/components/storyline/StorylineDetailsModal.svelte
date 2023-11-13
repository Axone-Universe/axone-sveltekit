<script lang="ts">
	import type { StorylineProperties } from '$lib/properties/storyline';
	import { modalStore, toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';

	export let storyline: HydratedDocument<StorylineProperties>;

	let customClass = '';
	export { customClass as class };

	let notifications = {};

	let closeModal = () => {
		modalStore.close();
	};

	async function submit() {
		// permissions = permissions.map
		if (storyline._id) {
			updateStoryline();
		} else {
			createStoryline();
		}

		return false;
	}

	async function createStoryline() {
		let toastMessage = 'Creation Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.storylines.create.mutate({
				title: storyline.title!,
				description: storyline.description!,
				book: storyline.book!,
				imageURL: storyline.imageURL!,
				parent: storyline.parent!,
				parentChapter: storyline.parentChapter!,
				permissions: storyline.permissions,
				notifications: notifications
			})
			.then((response) => {
				storyline = response.data as HydratedDocument<StorylineProperties>;
				toastMessage = response.message;
				toastBackground = 'bg-success-500';
				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(storyline) : '';
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

	async function updateStoryline() {
		let toastMessage = 'Saving Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.storylines.update.mutate({
				id: storyline._id,
				title: storyline.title,
				description: storyline.description,
				permissions: storyline.permissions,
				notifications: notifications
			})
			.then((response) => {
				storyline = response.data as HydratedDocument<StorylineProperties>;
				toastMessage = response.message;
				toastBackground = 'bg-success-500';

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(storyline) : '';
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
	on:submit|preventDefault={submit}
	class={`modal-example-form card p-4 w-modal h-[780px] shadow-xl space-y-4 overflow-y-auto ${customClass}`}
>
	<div class="modal-form p-4 space-y-4 rounded-container-token">
		<label>
			* Storyline Title

			<input
				class="input"
				type="text"
				bind:value={storyline.title}
				placeholder="Chapter Title"
				required
			/>
		</label>
		<label>
			* Storyline Description
			<textarea class="textarea h-44 overflow-hidden" bind:value={storyline.description} required />
		</label>

		<div>
			Permissions
			<ManagePermissions
				bind:permissionedDocument={storyline}
				{notifications}
				permissionedDocumentType="Storyline"
			/>
		</div>
	</div>
	<footer class="modal-footer flex justify-end space-x-2">
		<button on:click={closeModal} class="btn variant-ghost-surface" type="button">Cancel</button>
		<button class="btn variant-filled" type="submit">Save</button>
	</footer>
</form>
