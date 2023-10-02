<script lang="ts">
	import Icon from 'svelte-awesome';
	import { pencil, trash } from 'svelte-awesome/icons';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import type { HydratedDocument } from 'mongoose';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import { modalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import type { UserProperties } from '$lib/properties/user';
	import { onMount } from 'svelte';
	import StorylinePreview from '$lib/components/storyline/StorylinePreview.svelte';

	export let data: PageData;
	let user: HydratedDocument<UserProperties> | undefined = undefined;
	$: readingLists = user ? Object.keys(user.readingLists) : [];
	let selectedList = '';
	let readingListToDelete = '';
	let readingListToRename = '';

	const createReadingListModal: ModalSettings = {
		type: 'prompt',
		title: 'Create Reading List',
		body: 'Enter the name of your new reading list below.',
		value: '',
		valueAttr: { type: 'text', maxlength: 20, required: true },
		response: async (r) => {
			if (r) submitCreateReadingList(r);
		}
	};

	const deleteReadingListModal: ModalSettings = {
		type: 'confirm',
		title: 'Delete Reading list',
		response: (r: boolean) => submitDeleteReadingList(r)
	};

	const renameReadingListModal: ModalSettings = {
		type: 'prompt',
		title: 'Rename Reading List',
		value: '',
		valueAttr: { type: 'text', maxlength: 20, required: true },
		response: async (r) => {
			if (r) submitRenameReadingList(r);
		}
	};

	onMount(() => {
		async function getUser() {
			if (data.session) {
				const maybeUser = await trpc($page).users.getById.query({ id: data.session.user.id });
				if (maybeUser) {
					user = maybeUser as HydratedDocument<UserProperties>;
				}
			}
		}

		getUser();
	});

	$: getStorylines = trpcWithQuery($page).users.getReadingList.createQuery(
		{
			name: selectedList
		},
		{
			queryKey: ['readingList', selectedList]
		}
	);

	$: items = $getStorylines.data
		? ($getStorylines.data as HydratedDocument<StorylineProperties>[])
		: [];

	function handleTryAgain() {
		$getStorylines.refetch();
	}

	function handleCreateReadingList() {
		modalStore.trigger(createReadingListModal);
	}

	function handleDeleteReadingList(name: string) {
		readingListToDelete = name;
		deleteReadingListModal.body = `Are you sure you wish to delete "${name}?"`;
		modalStore.trigger(deleteReadingListModal);
	}

	function handleRenameReadingList(name: string) {
		readingListToRename = name;
		renameReadingListModal.body = `Enter a new name for "${name}".`;
		modalStore.trigger(renameReadingListModal);
	}

	async function submitCreateReadingList(name: string) {
		user = (await trpc($page).users.createReadingList.mutate({
			name
		})) as HydratedDocument<UserProperties>;
	}

	async function submitDeleteReadingList(confirm: boolean) {
		if (confirm) {
			user = (await trpc($page).users.deleteReadingList.mutate({
				name: readingListToDelete
			})) as HydratedDocument<UserProperties>;
		}

		if (readingListToDelete === selectedList) {
			selectedList = readingLists.length > 0 ? readingLists[0] : '';
		}

		readingListToDelete = '';
	}

	async function submitRenameReadingList(newName: string) {
		user = (await trpc($page).users.renameReadingList.mutate({
			oldName: readingListToRename,
			newName
		})) as HydratedDocument<UserProperties>;

		readingListToRename = '';
	}

	async function addToReadingList(names: string[], storylineID: string) {
		try {
			user = (await trpc($page).users.updateReadingLists.mutate({
				names,
				storylineID: storylineID
			})) as HydratedDocument<UserProperties>;
			$getStorylines.refetch();
		} catch (e) {
			console.log(e);
		}
	}
</script>

<div class="flex">
	<div
		class="h-screen sticky top-16 hidden sm:flex flex-col w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-2 gap-2"
	>
		{#each readingLists as list}
			<div class="flex gap-1">
				<button
					class={`btn btn-sm w-full text-xs ${
						selectedList === list ? 'variant-filled-primary' : 'variant-filled'
					}`}
					on:click={() => (selectedList = list)}
				>
					{list}
				</button>
				<button class="btn-icon btn-icon-sm" on:click={() => handleRenameReadingList(list)}>
					<Icon data={pencil} />
				</button>
				<button class="btn-icon btn-icon-sm" on:click={() => handleDeleteReadingList(list)}>
					<Icon data={trash} />
				</button>
			</div>
		{/each}
		<button class="btn btn-sm variant-filled-secondary text-xs" on:click={handleCreateReadingList}>
			+
		</button>
	</div>
	{#if $getStorylines.isLoading}
		<div class="mt-8 flex justify-center h-16">
			<img src="/tail-spin.svg" alt="Loading spinner" />
		</div>
	{:else if $getStorylines.isError}
		<div class="mt-8 text-center space-y-8 w-full">
			<div>
				<p class="text-6xl">🤕</p>
				<h4>Something went wrong while fetching this reading list!</h4>
				<p>How about trying again?</p>
			</div>
			<button class="btn variant-filled-primary" on:click={handleTryAgain}>Try again</button>
		</div>
	{:else if items.length === 0}
		<div class="mt-8 text-center space-y-8 w-full">
			<div>
				<p class="text-6xl">😲</p>
				<h4>We've come up empty!</h4>
				<p>This reading list is empty. Why not add some storyline to it?</p>
			</div>
			<a href="/book/create" class="btn variant-filled-primary">Start writing</a>
		</div>
	{:else if selectedList === ''}
		<div class="mt-8 text-center space-y-8 w-full">
			<div>
				<p class="text-6xl">📚</p>
				<h4>Welcome to your library!</h4>
				<p>Select a reading list to see the storylines you've saved in it.</p>
			</div>
		</div>
	{:else}
		<div
			class="pt-4 px-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 grid-flow-row gap-2 w-full"
		>
			{#each items as item (item._id)}
				<div class="animate-fade animate-once animate-duration-1000 animate-ease-in-out">
					<StorylinePreview {addToReadingList} storyline={item} {user} />
				</div>
			{/each}
		</div>
	{/if}
</div>
