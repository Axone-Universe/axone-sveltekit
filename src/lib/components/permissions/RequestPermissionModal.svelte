<script lang="ts">
	import type { ChapterProperties } from '$lib/properties/chapter';
	import { getModalStore, getToastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { PermissionsEnum } from '$lib/properties/permission';
	import type { BookProperties } from '$lib/properties/book';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import { Icon } from 'svelte-awesome';
	import { lock, check, close } from 'svelte-awesome/icons';
	import type { UserProperties } from '$lib/properties/user';
	import { onMount } from 'svelte';

	export let document:
		| HydratedDocument<BookProperties>
		| HydratedDocument<ChapterProperties>
		| HydratedDocument<StorylineProperties>;

	let customClass = '';
	export { customClass as class };

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let sessionUserID = $page.data.session!.user.id;

	let closeModal = () => {
		modalStore.close();
	};

	function submit() {}
</script>

<form on:submit|preventDefault={submit} class={`card p-4 w-modal h-fit space-y-4 ${customClass}`}>
	<div class="flex flex-col items-center p-4 space-y-4 rounded-container-token">
		<h3>{document.title}</h3>
		<Icon class="border-none" data={lock} scale={5} />

		{#if document.user && typeof document.user !== 'string'}
			{#if document.archived}
				<button class="btn fixed variant-filled-warning font-sans top-32 w-1/6">
					<span>Archived</span>
				</button>
			{/if}
			<h4>Permissions</h4>
			<div class="flex flex-row space-x-2">
				{#each PermissionsEnum as permissionType}
					{#if document.permissions['public'] && permissionType === 'view'}
						<span class="chip variant-filled">
							<span><Icon data={check} /></span>
							<span class="capitalize">{permissionType}</span>
						</span>
					{:else if document.permissions['public'] && document.permissions['public'].permission === 'collaborate' && permissionType === 'collaborate'}
						<span class="chip variant-filled">
							<span><Icon data={check} /></span>
							<span class="capitalize">{permissionType}</span>
						</span>
					{:else if document.user._id === sessionUserID}
						<span class="chip variant-filled">
							<span><Icon data={check} /></span>
							<span class="capitalize">{permissionType}</span>
						</span>
					{:else if sessionUserID in document.permissions}
						{#if document.permissions[sessionUserID].permission === permissionType}
							<span class="chip variant-filled">
								<span><Icon data={check} /></span>
								<span class="capitalize">{permissionType}</span>
							</span>
						{:else}
							<span class="chip variant-soft">
								<span><Icon data={close} /></span>
								<span class="capitalize">{permissionType}</span>
							</span>
						{/if}
					{:else}
						<span class="chip variant-soft">
							<span><Icon data={close} /></span>
							<span class="capitalize">{permissionType}</span>
						</span>
					{/if}
				{/each}
			</div>

			<div>
				Request permissions from {document.user.email}
			</div>
		{/if}
	</div>
	<footer class="modal-footer flex flex-col items-center space-x-2">
		<div>
			<button class="btn variant-filled" on:click={closeModal} type="submit">Done</button>
		</div>
	</footer>
</form>
