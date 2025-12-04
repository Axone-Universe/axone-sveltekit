<script lang="ts">
	import type { ChapterProperties } from '$lib/properties/chapter';
	import { getModalStore, getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { HydratedDocument } from 'mongoose';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';

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

	// Track updated fields - initialize with id if chapter has one
	let updatedData: any = chapter._id ? { id: chapter._id } : {};

	// Track previous chapter._id to only reset when it actually changes
	let previousChapterId: string | undefined = chapter._id?.toString();

	// Reset updatedData only when chapter._id actually changes (not just when it's truthy)
	$: {
		const currentChapterId = chapter._id?.toString();
		if (currentChapterId && currentChapterId !== previousChapterId) {
			updatedData = { id: chapter._id };
			previousChapterId = currentChapterId;
		}
	}

	// Initialize on mount
	onMount(() => {
		previousChapterId = chapter._id?.toString();
	});

	// Handler functions that update both chapter and updatedData
	function handleTitleInput(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		chapter.title = value;
		updatedData.title = value;
	}

	function handleDescriptionInput(event: Event) {
		const value = (event.target as HTMLTextAreaElement).value;
		chapter.description = value;
		updatedData.description = value;
	}

	// Handle permissions changes from ManagePermissions component
	function handlePermissionsChange(event: CustomEvent<Record<string, any>>) {
		const newPermissions = event.detail;
		chapter.permissions = newPermissions;
		updatedData.permissions = newPermissions;
	}

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
			.then((response) => {
				chapter = response.data as HydratedDocument<ChapterProperties>;
				toastMessage = response.message;
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

		// Only send updatedData for updates (it already includes the id)
		const updatePayload: any = {
			...updatedData
		};

		// Include notifications if they exist
		if (Object.keys(notifications).length > 0) {
			updatePayload.notifications = notifications;
		}

		// If no changes detected (only id in updatedData), show a message and return
		const hasChanges = Object.keys(updatedData).filter((key) => key !== 'id').length > 0;
		if (!hasChanges && Object.keys(notifications).length === 0) {
			const t: ToastSettings = {
				message: 'No changes detected',
				background: 'variant-filled-primary',
				autohide: true
			};
			toastStore.trigger(t);
			return;
		}

		trpc($page)
			.chapters.update.mutate(updatePayload)
			.then((response) => {
				chapter = response.data as HydratedDocument<ChapterProperties>;

				// Reset updatedData after successful save (include id if chapter has one)
				updatedData = chapter._id ? { id: chapter._id } : {};

				toastMessage = response.message;
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
	<form on:submit|preventDefault={submit}>
		<fieldset {disabled}>
			<div class="space-y-4 rounded-container-token">
				<label>
					* Chapter Title
					<input
						class="input"
						type="text"
						value={chapter.title}
						on:input={handleTitleInput}
						placeholder="Chapter Title"
						required
					/>
				</label>
				<label>
					* Chapter Description
					<textarea
						class="textarea h-44 overflow-hidden"
						value={chapter.description}
						on:input={handleDescriptionInput}
						required
					/>
				</label>

				<div>
					Permissions
					<ManagePermissions
						bind:permissionedDocument={chapter}
						{notifications}
						permissionedDocumentType="Chapter"
						on:permissionsChange={handlePermissionsChange}
					/>
				</div>
			</div>
			{#if !disabled}
				<div class="flex flex-col justify-end sm:flex-row gap-2 w-full">
					<button on:click={modalStore.close} class="btn variant-ghost-surface" type="button"
						>Cancel</button
					>
					<button class="btn variant-filled">
						{chapter._id ? 'Update' : 'Create'}
					</button>
				</div>
			{/if}
		</fieldset>
	</form>
</div>
