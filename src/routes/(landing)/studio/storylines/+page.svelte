<script lang="ts">
	import { page } from '$app/stores';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { PageData } from './$types';
	import type { StorylineProperties, HydratedStorylineProperties } from '$lib/properties/storyline';
	import { decodeTime } from 'ulid';
	import {
		type ModalSettings,
		type ModalComponent,
		type ToastSettings,
		getToastStore,
		getModalStore
	} from '@skeletonlabs/skeleton';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import StorylineDetails from '$lib/components/storyline/StorylineDetails.svelte';
	import StudioImage from '$lib/components/studio/StudioImage.svelte';
	import ArchiveToggle from '$lib/components/studio/ArchiveToggle.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import { getArchiveModal, getUnarchiveModal } from '$lib/util/studio/modals';
	import { formattedDate } from '$lib/util/studio/strings';
	import RowActions from '$lib/components/studio/RowActions.svelte';
	import DrawerButton from '$lib/components/studio/DrawerButton.svelte';
	import StorylineModal from '$lib/components/storyline/StorylineModal.svelte';
	import ScrollToTopButton from '$lib/components/util/ScrollToTopButton.svelte';
	import { debouncedScrollCallback } from '$lib/util/debouncedCallback';
	import ArchiveSelectedButton from '$lib/components/studio/ArchiveSelectedButton.svelte';
	import ViewFilters from '$lib/components/studio/ViewFilters.svelte';
	import { edit, trash } from 'svelte-awesome/icons';
	import Tutorial from './tutorial.svelte';
	import { deleteBucket } from '$lib/util/bucket/bucket';

	const archiveModal = getArchiveModal();
	const unArchiveModal = getUnarchiveModal();

	export let data: PageData;
	const { supabase } = data;

	let archiveMode: boolean = false;
	let lastLoadEpoch = 0;
	let selectedStorylines: HydratedDocument<StorylineProperties>[] = [];

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	const storylineDetailsModalComponent: ModalComponent = {
		ref: StorylineDetails
	};

	const storylineDetailsModal: ModalSettings = {
		type: 'component',
		component: storylineDetailsModalComponent
	};

	const storylineModalComponent: ModalComponent = {
		ref: StorylineModal
	};

	const storylineModal: ModalSettings = {
		type: 'component',
		component: storylineModalComponent,
		response: (r) => undefined
	};

	// TODO: add archiveMode to query when respective backend logic is done
	$: getStorylinesInfinite = trpcWithQuery($page).storylines.get.createInfiniteQuery(
		{
			limit: 10,
			user: data.session?.user.id,
			archived: archiveMode
		},
		{
			queryKey: ['storylinesStudio', archiveMode],
			getNextPageParam: (lastPage) => lastPage.cursor
		}
	);

	$: storylines = $getStorylinesInfinite?.data
		? ($getStorylinesInfinite.data.pages.flatMap(
				(page) => page.data
		  ) as HydratedDocument<HydratedStorylineProperties>[])
		: [];

	function openArchiveModal(storylines: HydratedDocument<StorylineProperties>[]) {
		if (storylines.length > 1) {
			archiveModal.body = `Are you sure you want to archive these ${storylines.length} storylines? Doing so will archive all the chapters you've created for them too.`;
		} else {
			archiveModal.body = `Are you sure you want to archive ${storylines[0].title}? Doing so will archive all the chapters you've created for it too.`;
		}

		archiveModal.response = async (r: boolean) => {
			if (r) {
				await setArchive(storylines, true);
				refetch();
			}
		};
		modalStore.trigger(archiveModal);
	}

	function openUnarchiveModal(storylines: HydratedDocument<StorylineProperties>[]) {
		if (storylines.length > 1) {
			unArchiveModal.body = `Are you sure you want to unarchive these ${storylines.length} storylines? Doing so will unarchive all the chapters you've created for them too.`;
		} else {
			unArchiveModal.body = `Are you sure you want to unarchive ${storylines[0].title}? Doing so will unarchive all the chapters you've created for it too.`;
		}

		unArchiveModal.response = async (r: boolean) => {
			if (r) {
				await setArchive(storylines, false);
				refetch();
			}
		};
		modalStore.trigger(unArchiveModal);
	}

	async function setArchive(
		storylines: HydratedDocument<StorylineProperties>[],
		archived: boolean
	) {
		const ids = storylines.map((s) => s._id);
		const resp = await trpc($page).storylines.setArchived.mutate({ ids, archived });
	}

	function openEditModal(storyline: HydratedDocument<StorylineProperties>) {
		storylineDetailsModalComponent.props = {
			book: storyline.book,
			storyline,
			supabase: data.supabase,
			cancelCallback: modalStore.close,
			createCallback: () => {
				refetch();
				modalStore.close();
			}
		};
		modalStore.trigger(storylineDetailsModal);
	}

	function openStorylineModal(storyline: HydratedDocument<StorylineProperties>) {
		storylineModalComponent.props = {
			storylineData: storyline,
			showEdit: true
		};
		modalStore.trigger(storylineModal);
	}

	function loadMore() {
		lastLoadEpoch = debouncedScrollCallback(lastLoadEpoch, $getStorylinesInfinite.fetchNextPage);
	}

	async function refetch() {
		$getStorylinesInfinite.remove();
		await $getStorylinesInfinite.refetch();
		selectedStorylines = [];
	}

	function handleStorylineSelect(
		e: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		},
		storyline: HydratedDocument<StorylineProperties>
	) {
		if ((e.target as HTMLInputElement).checked) {
			if (!selectedStorylines.includes(storyline)) {
				selectedStorylines = [...selectedStorylines, storyline];
			}
		} else {
			selectedStorylines = selectedStorylines.filter((s) => s !== storyline);
		}
	}

	function deleteStoryline(storylineToDelete: HydratedDocument<StorylineProperties>) {
		const modal: ModalSettings = {
			type: 'confirm',
			// Data
			title: storylineToDelete.title,
			body: 'Are you sure you want to delete this storyline?',
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r) {
					trpc($page)
						.storylines.delete.mutate({
							id: storylineToDelete._id
						})
						.then(async (response) => {
							if (response.success) {
								let bookID =
									typeof storylineToDelete.book === 'string'
										? storylineToDelete.book
										: storylineToDelete.book?._id;
								await deleteBucket({
									supabase: supabase,
									bucket: 'books',
									path: `${bookID}/storylines/${storylineToDelete._id}`
								});
								storylines = storylines.filter(
									(storyline) => storyline._id !== storylineToDelete._id
								);
							}
							const deleteFail: ToastSettings = {
								message: response.message,
								background: response.success ? 'variant-filled-success' : 'variant-filled-error'
							};
							toastStore.trigger(deleteFail);
						})
						.catch((error) => {
							console.log(error);
						});
				}
			}
		};
		modalStore.trigger(modal);
	}
</script>

<svelte:window on:scroll={loadMore} />

<Tutorial />
<div class="min-h-screen w-full overflow-hidden">
	<div class="w-full min-h-screen flex flex-col gap-2">
		<DrawerButton />

		<div class="table-container min-w-full">
			<table class="table table-hover table-compact">
				<thead>
					<tr>
						<th />
						<th>Cover</th>
						<th>Title</th>
						<th>Book</th>
						<th>Date Created</th>
						<th />
					</tr>
				</thead>
				<tbody>
					<tr>
						<td colspan="3">
							<div class="flex sm:justify-start">
								<ViewFilters>
									<ArchiveToggle bind:archiveMode />
								</ViewFilters>
							</div>
						</td>
						<td colspan="3">
							<div class="flex sm:justify-start sm:flex-row-reverse items-center gap-2 sm:gap-4">
								<ArchiveSelectedButton
									selected={selectedStorylines}
									{archiveMode}
									{openArchiveModal}
									{openUnarchiveModal}
								/>
							</div>
						</td>
					</tr>
					{#if $getStorylinesInfinite.isLoading}
						<tr>
							<td colspan="6">
								<LoadingSpinner />
							</td>
						</tr>
					{:else if $getStorylinesInfinite.isError}
						<tr>
							<td colspan="6">
								<InfoHeader
									emoji="🤕"
									heading="Oops!"
									description="Something went wrong while getting your storylines! Please try again later."
								/>
							</td>
						</tr>
					{:else if storylines.length === 0}
						<tr>
							<td colspan="6">
								<InfoHeader
									emoji="🤲"
									heading="We're empty handed!"
									description="It looks like you don't have any {archiveMode
										? 'archived'
										: 'unarchived'} storylines."
								/>
							</td>
						</tr>
					{:else}
						{#each storylines as storyline}
							<tr>
								<td>
									<input
										class="checkbox"
										type="checkbox"
										on:change={(e) => handleStorylineSelect(e, storyline)}
									/>
								</td>
								<td>
									<StudioImage
										src={storyline.imageURL ?? ''}
										alt={storyline.title ?? ''}
										buttonCallback={() => openStorylineModal(storyline)}
									/>
								</td>
								<td>{storyline.title}</td>
								<td>
									{#if storyline.book}
										{storyline.book.title}
									{/if}
								</td>
								<td>{formattedDate(new Date(decodeTime(storyline._id)))}</td>
								<td>
									<RowActions
										document={storyline}
										rowActions={[
											{
												label: 'Edit',
												icon: edit,
												callback: openEditModal
											},
											{
												label: 'Delete',
												icon: trash,
												callback: deleteStoryline
											}
										]}
									/>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		{#if !$getStorylinesInfinite.hasNextPage}
			<ScrollToTopButton />
		{/if}
	</div>
</div>
