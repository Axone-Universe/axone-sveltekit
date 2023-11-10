<script lang="ts">
	import type { ChapterProperties } from '$lib/properties/chapter';
	import { modalStore, toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';

	export let chapter: HydratedDocument<ChapterProperties>;
	export let bookID: string;
	export let storylineID: string;
	export let prevChapterID: string;
	let customClass = '';
	export { customClass as class };

	let disabled =
		$page.data.user._id !== (typeof chapter.user === 'string' ? chapter.user : chapter.user!._id);

	let notifications = {};

	async function submit() {
		// permissions = permissions.map
		if (chapter._id) {
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
				title: chapter.title!,
				bookID,
				storylineID,
				prevChapterID,
				description: chapter.description!,
				permissions: chapter.permissions,
				notifications
			})
			.then((chapterNodeResponse) => {
				chapter = chapterNodeResponse as HydratedDocument<ChapterProperties>;
				toastMessage = 'Sunccessfully Created';
				toastBackground = 'bg-success-500';
				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(chapter) : '';
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

		console.log('** sv per,s');

		trpc($page)
			.chapters.update.mutate({
				id: chapter._id,
				title: chapter.title,
				description: chapter.description,
				permissions: chapter.permissions,
				notifications: notifications
			})
			.then((chapterNodeResponse) => {
				chapter = chapterNodeResponse as HydratedDocument<ChapterProperties>;
				toastMessage = 'Successfully Saved';
				toastBackground = 'bg-success-500';

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(chapter) : '';
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

<div class={`card p-4 shadow-xl space-y-4 overflow-y-auto ${customClass} w-modal`}>
	<div class="space-y-4 rounded-container-token">
		<label>
			* Chapter Title
			<input
				class="input"
				type="text"
				bind:value={chapter.title}
				placeholder="Chapter Title"
				required
			/>
		</label>
		<label>
			* Chapter Description
			<textarea class="textarea h-44 overflow-hidden" bind:value={chapter.description} required />
		</label>

		<div>
			Permissions
			<ManagePermissions bind:permissionedDocument={chapter} permissionedDocumentType="Chapter" />
		</div>
	</div>
	{#if !disabled}
		<div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
			<button on:click={modalStore.close} class="btn variant-ghost-surface">Cancel</button>
			<button class="btn variant-filled" on:click={submit}>
				{chapter._id ? 'Update' : 'Create'}
			</button>
		</div>
	{/if}
</div>
