<script lang="ts">
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { arrowRight, pencil, trash } from 'svelte-awesome/icons';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import type { HydratedDocument } from 'mongoose';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import {
		type ModalSettings,
		type DrawerSettings,
		getDrawerStore,
		getModalStore
	} from '@skeletonlabs/skeleton';
	import type { UserProperties } from '$lib/properties/user';
	import { onMount } from 'svelte';
	import StorylinePreview from '$lib/components/storyline/StorylinePreview.svelte';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import Tutorial from './tutorial.svelte';

	export let data: PageData;
	let user: HydratedDocument<UserProperties> | undefined = undefined;
	$: readingLists = user ? Object.keys(user.readingLists!) : [];
	let selectedList = '';
	let readingListToDelete = '';
	let readingListToRename = '';

	const drawerStore = getDrawerStore();
	const modalStore = getModalStore();

	const createReadingListModal: ModalSettings = {
		type: 'prompt',
		title: 'Create Reading List',
		body: 'Enter the name of your new reading list below.',
		value: '',
		valueAttr: { type: 'text', maxlength: 20, required: true },
		response: (r) => {
			if (r) submitCreateReadingList(r);
		}
	};

	const deleteReadingListModal: ModalSettings = {
		type: 'confirm',
		title: 'Delete Reading list',
		response: (r: boolean) => {
			if (r) {
				submitDeleteReadingList(r);
			}
		}
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
				const maybeUserResponse = await trpc($page).users.getById.query({
					id: data.session.user.id
				});
				if (maybeUserResponse.data) {
					user = maybeUserResponse.data as HydratedDocument<UserProperties>;
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
		? ($getStorylines.data.data as HydratedDocument<StorylineProperties>[])
		: [];

	function handleTryAgain() {
		$getStorylines.refetch();
	}

	function handleCreateReadingList() {
		modalStore.trigger(createReadingListModal);
	}

	function handleDeleteReadingList(name: string) {
		readingListToDelete = name;
		deleteReadingListModal.body = `Are you sure you want to delete "${name}?"`;
		modalStore.trigger(deleteReadingListModal);
	}

	function handleRenameReadingList(name: string) {
		readingListToRename = name;
		renameReadingListModal.body = `Enter a new name for "${name}".`;
		modalStore.trigger(renameReadingListModal);
	}

	function selectList(name: string) {
		selectedList = name;
	}

	function handleDrawerButton() {
		const drawerSettings: DrawerSettings = {
			id: 'library',
			meta: {
				selectedList,
				readingLists,
				handleCreateReadingList,
				handleRenameReadingList,
				handleDeleteReadingList,
				selectList
			},
			bgDrawer: 'bg-surface-100-800-token',
			width: 'w-4/6',
			padding: 'p-4',
			rounded: 'rounded-xl'
		};

		drawerStore.open(drawerSettings);
	}

	async function submitCreateReadingList(name: string) {
		const userResponse = await trpc($page).users.createReadingList.mutate({
			name
		});
		user = userResponse.data as HydratedDocument<UserProperties>;
	}

	async function submitDeleteReadingList(confirm: boolean) {
		if (confirm) {
			let userResponse = await trpc($page).users.deleteReadingList.mutate({
				name: readingListToDelete
			});
			user = userResponse.data as HydratedDocument<UserProperties>;
		}

		if (readingListToDelete === selectedList) {
			selectedList = '';
		}

		readingListToDelete = '';
	}

	async function submitRenameReadingList(newName: string) {
		let userResponse = await trpc($page).users.renameReadingList.mutate({
			oldName: readingListToRename,
			newName
		});

		user = userResponse.data as HydratedDocument<UserProperties>;
		readingListToRename = '';
	}

	async function addToReadingList(names: string[], storylineID: string) {
		try {
			let userResponse = await trpc($page).users.updateReadingLists.mutate({
				names,
				storylineID: storylineID
			});
			user = userResponse.data as HydratedDocument<UserProperties>;
			$getStorylines.refetch();
		} catch (e) {
			console.log(e);
		}
	}
</script>

<Tutorial />
<div class="flex min-h-screen relative w-full">
	<div
		class="min-h-screen rounded-lg m-2 sticky top-16 hidden sm:flex flex-col justify-between w-64 min-w-[16rem] bg-surface-100-800-token pt-4 pb-24 p-4 gap-2"
	>
		<div class="flex flex-col gap-2">
			{#each readingLists as list}
				<button
					id="reading-list-select"
					class="flex justify-between items-center btn btn-sm {selectedList === list
						? 'variant-filled-primary'
						: 'variant-filled'} py-1"
					on:click={() => (selectedList = list)}
				>
					<p class="truncate w-full text-left">
						{list}
					</p>
					<div class="flex">
						<button class="btn-icon btn-icon-sm" on:click={() => handleRenameReadingList(list)}>
							<Icon data={pencil} scale={1.2} />
						</button>
						<button class="btn-icon btn-icon-sm" on:click={() => handleDeleteReadingList(list)}>
							<Icon data={trash} scale={1.2} />
						</button>
					</div>
				</button>
			{/each}
		</div>
		<button
			id="create-reading-list"
			class="btn variant-filled-secondary"
			on:click={handleCreateReadingList}
		>
			+
		</button>
	</div>
	<div class="fixed top-20 left-4 flex sm:hidden items-center gap-2 z-[100]">
		<button class="btn-icon btn-icon-sm variant-filled" on:click={handleDrawerButton}>
			<Icon data={arrowRight} />
		</button>
		<p class="text-sm">{selectedList}</p>
	</div>
	{#if selectedList === ''}
		<InfoHeader
			emoji="📚"
			heading="Welcome to your library!"
			description="Select a reading list to see the storylines you've saved in it."
		/>
	{:else if $getStorylines.isLoading}
		<LoadingSpinner />
	{:else if $getStorylines.isError}
		<InfoHeader emoji="🤕" heading="Something went wrong..." description="How about trying again?">
			<button class="btn variant-filled-primary" on:click={handleTryAgain}>Try again</button>
		</InfoHeader>
	{:else if items.length === 0}
		<InfoHeader
			emoji="🤲"
			heading="We're empty handed!"
			description="This reading list is empty. Why not add some storylines to it?"
		>
			<a href="/home" class="btn variant-filled-primary">Browse books</a>
		</InfoHeader>
	{:else}
		<div
			class="pt-16 sm:pt-4 px-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 grid-flow-row gap-2 w-full h-fit"
		>
			{#each items as item (item._id)}
				<div class="animate-fade animate-once animate-duration-1000 animate-ease-in-out">
					<StorylinePreview {addToReadingList} storyline={item} {user} />
				</div>
			{/each}
		</div>
	{/if}
</div>
