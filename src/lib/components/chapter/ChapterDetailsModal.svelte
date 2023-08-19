<script lang="ts">
	import type { ChapterProperties } from '$lib/shared/chapter';
	import { modalStore, toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';
	import type { PermissionProperties } from '$lib/shared/permission';

	export let chapterNode: HydratedDocument<ChapterProperties>;
	export let bookID: string;
	export let storylineID: string;
	export let prevChapterID: string;

	let customClass = '';
	export { customClass as class };

	let permissions: Map<string, HydratedDocument<PermissionProperties>> = {};

	let closeModal = () => {
		modalStore.close();
	};

	async function submit() {
		// permissions = permissions.map
		if (chapterNode._id) {
			updateChapter();
		} else {
			createChapter();
		}

		return false;
	}

	async function createChapter() {
		let toastMessage = 'Creation Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.chapters.create.mutate({
				title: chapterNode.title!,
				bookID: bookID,
				storylineID: storylineID,
				prevChapterID: prevChapterID ? prevChapterID : '',
				description: chapterNode.description!,
				permissions: Object.values(permissions) as any
			})
			.then((chapterNodeResponse) => {
				chapterNode = chapterNodeResponse as HydratedDocument<ChapterProperties>;
				toastMessage = 'Sunccessfully Created';
				toastBackground = 'bg-success-500';
				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(chapterNode) : '';
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

	async function updateChapter() {
		let toastMessage = 'Saving Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.chapters.update.mutate({
				id: chapterNode._id,
				title: chapterNode.title,
				description: chapterNode.description,
				permissions: Object.values(permissions) as any
			})
			.then((chapterNodeResponse) => {
				chapterNode = chapterNodeResponse as HydratedDocument<ChapterProperties>;
				toastMessage = 'Sunccessfully Saved';
				toastBackground = 'bg-success-500';

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(chapterNode) : '';
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
			* Chapter Title

			<input
				class="input"
				type="text"
				bind:value={chapterNode.title}
				placeholder="Chapter Title"
				required
			/>
		</label>
		<label>
			* Chapter Description
			<textarea
				class="textarea h-44 overflow-hidden"
				bind:value={chapterNode.description}
				required
			/>
		</label>

		<div>
			Permissions
			<ManagePermissions {permissions} permissionedDocument={chapterNode} />
		</div>
	</div>
	<footer class="modal-footer flex justify-end space-x-2">
		<button on:click={closeModal} class="btn variant-ghost-surface" type="button">Cancel</button>
		<button class="btn variant-filled" type="submit">Save</button>
	</footer>
</form>
