<script lang="ts">
	import type { ChapterProperties } from '$lib/properties/chapter';
	import { type ToastSettings } from '@skeletonlabs/skeleton-svelte';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';
	import { toaster } from '$lib/util/toaster/toaster-svelte';

	export let chapter: HydratedDocument<ChapterProperties>;
	export let bookID: string;
	export let storylineID: string;
	export let prevChapterID: string;
	export let disabled: false;

	let customClass = '';
	export { customClass as class };

	const toastStore = getToastStore();
	const modalStore = getModalStore();

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
		let type = 'error';

		let createDetails = {
			title: chapter.title!,
			bookID,
			storylineID,
			prevChapterID,
			description: chapter.description!,
			permissions: chapter.permissions,
			notifications
		};

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
			.then((response) => {
				chapter = response.data as HydratedDocument<ChapterProperties>;
				toastMessage = response.message;
				type = 'success';

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(chapter) : '';
				}

				console.log(response.message);
			})
			.finally(() => {
				toaster.info({
					title: toastMessage,
					type: type
				});
				modalStore.close();
			});
	}

	async function updateChapter() {
		let toastMessage = 'Saving Failed';
		let type = 'error';

		trpc($page)
			.chapters.update.mutate({
				id: chapter._id,
				title: chapter.title,
				description: chapter.description,
				permissions: chapter.permissions,
				notifications: notifications
			})
			.then((response) => {
				chapter = response.data as HydratedDocument<ChapterProperties>;
				toastMessage = response.message;
				type = 'success';

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(chapter) : '';
				}
			})
			.finally(() => {
				toaster.info({
					title: toastMessage,
					type: type
				});
				modalStore.close();
			});
	}
</script>

<div class="{`card p-4 shadow-xl space-y-4 overflow-y-auto ${customClass} w-modal`}">
	<form on:submit|preventDefault="{submit}">
		<fieldset disabled="{disabled}">
			<div class="space-y-4 rounded-container">
				<label>
					* Chapter Title
					<input
						class="input"
						type="text"
						bind:value="{chapter.title}"
						placeholder="Chapter Title"
						required
					/>
				</label>
				<label>
					* Chapter Description
					<textarea
						class="textarea h-44 overflow-hidden"
						bind:value="{chapter.description}"
						required></textarea>
				</label>

				<div>
					Permissions
					<ManagePermissions
						bind:permissionedDocument="{chapter}"
						notifications="{notifications}"
						permissionedDocumentType="Chapter"
					/>
				</div>
			</div>
			{#if !disabled}
				<div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
					<button
						onclick="{modalStore.close}"
						class="btn preset-tonal-surface border border-surface-500"
						type="button">Cancel</button
					>
					<button class="btn preset-filled">
						{chapter._id ? 'Update' : 'Create'}
					</button>
				</div>
			{/if}
		</fieldset>
	</form>
</div>
