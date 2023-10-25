<script lang="ts">
	import type { BookProperties } from '$lib/properties/book';
	import { modalStore, toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';

	export let bookData: HydratedDocument<BookProperties>;

	let customClass = '';
	export { customClass as class };

	let closeModal = () => {
		modalStore.close();
	};

	let notifications = {};

	async function submit() {
		// permissions = permissions.map
		if (bookData._id) {
			updateBook();
		} else {
			createBook();
		}

		return false;
	}
	async function createBook() {
		let toastMessage = 'Creation Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.books.create.mutate({
				title: bookData.title!,
				description: bookData.description!,
				imageURL: bookData.imageURL,
				genres: bookData.genres,
				permissions: bookData.permissions,
				notifications: notifications
			})
			.then((bookNodeResponses) => {
				bookData = bookNodeResponses as HydratedDocument<BookProperties>;
				toastMessage = 'Sunccessfully Created';
				toastBackground = 'bg-success-500';
				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(bookData) : '';
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

	async function updateBook() {
		let toastMessage = 'Saving Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.books.update.mutate({
				id: bookData._id,
				title: bookData.title,
				description: bookData.description,
				imageURL: bookData.imageURL,
				genres: bookData.genres,
				permissions: bookData.permissions,
				notifications: notifications
			})
			.then((bookNodeResponses) => {
				bookData = bookNodeResponses as HydratedDocument<BookProperties>;
				toastMessage = 'Successfully Saved';
				toastBackground = 'bg-success-500';

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(bookData) : '';
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
			* Book Title

			<input
				class="input"
				type="text"
				bind:value={bookData.title}
				placeholder="Chapter Title"
				required
			/>
		</label>
		<label>
			* Book Description
			<textarea class="textarea h-44 overflow-hidden" bind:value={bookData.description} required />
		</label>

		<div>
			Permissions
			<ManagePermissions permissionedDocument={bookData} {notifications} />
		</div>
	</div>
	<footer class="modal-footer flex justify-end space-x-2">
		<button on:click={closeModal} class="btn variant-ghost-surface" type="button">Cancel</button>
		<button class="btn variant-filled" type="submit">Save</button>
	</footer>
</form>
