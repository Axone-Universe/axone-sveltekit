<script lang="ts">
	import {
		getModalStore,
		type ModalSettings,
		getToastStore,
		type ToastSettings
	} from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import type { UserProperties } from '$lib/properties/user';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { plus } from 'svelte-awesome/icons';

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let user = $modalStore[0].meta.user;
	let readingLists = Object.keys(user.readingLists);
	let selected: boolean[] = [];
	let showCreateInput = false;
	let newReadingListName = '';
	export let parent: any;

	onMount(() => {
		for (const [key, value] of Object.entries(user.readingLists)) {
			if ((value as string[]).includes($modalStore[0].meta.storylineID)) {
				selected.push(true);
			} else {
				selected.push(false);
			}
		}
	});

	function onFormSubmit(): void {
		if ($modalStore[0].response) {
			$modalStore[0].response(readingLists.filter((o, i) => selected[i]));
		}
		modalStore.close();
	}

	function onSelectReadingList(e: Event, index: number) {
		selected[index] = (e.target as HTMLInputElement).checked;
	}

	function onCreateReadingListButton() {
		showCreateInput = !showCreateInput;
		newReadingListName = '';
	}

	async function submitCreateReadingList() {
		if (!newReadingListName.trim()) {
			const toast: ToastSettings = {
				message: 'Please enter a reading list name',
				background: 'variant-filled-warning'
			};
			toastStore.trigger(toast);
			return;
		}

		try {
			const userResponse = await trpc($page).users.createReadingList.mutate({
				name: newReadingListName.trim()
			});

			if (userResponse.success) {
				user = userResponse.data as HydratedDocument<UserProperties>;
				readingLists = Object.keys(user.readingLists);
				// Add the new list to selected array (unchecked by default)
				selected = [...selected, false];

				// Update the modal meta with the new user data
				if ($modalStore[0]) {
					$modalStore[0].meta.user = user;
				}

				const toast: ToastSettings = {
					message: `Reading list "${newReadingListName}" created successfully!`,
					background: 'variant-filled-success'
				};
				toastStore.trigger(toast);

				// Reset input and hide it
				newReadingListName = '';
				showCreateInput = false;
			} else {
				const toast: ToastSettings = {
					message: userResponse.message || 'Failed to create reading list',
					background: 'variant-filled-error'
				};
				toastStore.trigger(toast);
			}
		} catch (error) {
			console.error('Error creating reading list:', error);
			const toast: ToastSettings = {
				message: 'Error creating reading list',
				background: 'variant-filled-error'
			};
			toastStore.trigger(toast);
		}
	}

	function onGoToLibrary() {
		modalStore.close();
		goto('/library');
	}
</script>

{#if $modalStore[0]}
	<div class="card p-4 w-modal shadow-xl space-y-4">
		<header class="text-2xl font-bold">{$modalStore[0].title ?? '(title missing)'}</header>
		<article>{$modalStore[0].body ?? '(body missing)'}</article>
		<div class="space-y-2">
			{#if showCreateInput}
				<div class="flex items-center gap-2 p-2 variant-soft rounded-lg">
					<input
						class="input flex-1"
						type="text"
						placeholder="Enter reading list name..."
						maxlength="20"
						bind:value={newReadingListName}
						on:keydown={(e) => e.key === 'Enter' && submitCreateReadingList()}
					/>
					<button
						class="btn-icon variant-filled-primary"
						on:click={submitCreateReadingList}
						title="Create reading list"
					>
						<Icon data={plus} scale={1.2} />
					</button>
				</div>
			{/if}
			<div class="space-y-2 h-32 overflow-y-auto">
				{#each readingLists as name, index}
					<label class="flex items-center space-x-2 px-2">
						<input
							class="checkbox"
							type="checkbox"
							value={name}
							checked={user.readingLists[name].includes($modalStore[0].meta.storylineID)}
							on:change={(e) => onSelectReadingList(e, index)}
						/>
						<p>{name}</p>
					</label>
				{/each}
				{#if readingLists.length === 0}
					It looks like you don't have any reading lists! You can create one in your library.
				{/if}
			</div>
		</div>
		<footer class={parent.regionFooter}>
			<button class="btn {parent.buttonNeutral}" on:click={parent.onClose}>
				{parent.buttonTextCancel}
			</button>
			<button class="btn variant-filled-secondary" on:click={onCreateReadingListButton}>
				Create New
			</button>
			{#if readingLists.length === 0}
				<button class="btn variant-filled" on:click={onGoToLibrary}>Go to library</button>
			{:else}
				<button class="btn {parent.buttonPositive}" on:click={onFormSubmit}>Submit</button>
			{/if}
		</footer>
	</div>
{/if}
