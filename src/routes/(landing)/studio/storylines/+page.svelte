<script lang="ts">
	import { page } from '$app/stores';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { PageData } from './$types';
	import type { StorylineProperties, HydratedStorylineProperties } from '$lib/properties/storyline';
	import { decodeTime } from 'ulid';
	import { type ModalSettings, modalStore, type ModalComponent } from '@skeletonlabs/skeleton';
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

	const archiveModal = getArchiveModal();
	const unArchiveModal = getUnarchiveModal();

	export let data: PageData;

	let archiveMode: boolean = false;
	let lastLoadEpoch = 0;

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
				(page) => page.result
		  ) as HydratedDocument<HydratedStorylineProperties>[])
		: [];

	function openArchiveModal(storyline: HydratedDocument<StorylineProperties>) {
		archiveModal.body = `Are you sure you want to archive ${storyline.title}?`;
		archiveModal.response = async (r: boolean) => {
			if (r) {
				await setArchive(storyline._id, true);
				refetch();
			}
		};
		modalStore.trigger(archiveModal);
	}

	function openUnarchiveModal(storyline: HydratedDocument<StorylineProperties>) {
		unArchiveModal.body = `Are you sure you want to unarchive ${storyline.title}?`;
		unArchiveModal.response = async (r: boolean) => {
			if (r) {
				await setArchive(storyline._id, false);
				refetch();
			}
		};
		modalStore.trigger(unArchiveModal);
	}

	async function setArchive(id: string, archived: boolean) {
		const resp = await trpc($page).storylines.setArchived.mutate({ id, archived });
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
			},
			class:
				'flex flex-col space-y-4 my-8 mx-4 items-center md:space-y-0 md:items-start md:flex-row lg:mx-32 xl:mx-60'
		};
		modalStore.trigger(storylineDetailsModal);
	}

	function openStorylineModal(storyline: HydratedDocument<StorylineProperties>) {
		storylineModalComponent.props = {
			storylineData: storyline,
			isStudio: true
		};
		modalStore.trigger(storylineModal);
	}

	function loadMore() {
		lastLoadEpoch = debouncedScrollCallback(lastLoadEpoch, $getStorylinesInfinite.fetchNextPage);
	}

	async function refetch() {
		$getStorylinesInfinite.remove();
		await $getStorylinesInfinite.refetch();
	}
</script>

<svelte:window on:scroll={loadMore} />

<div class="min-h-screen w-full overflow-hidden">
	<div class="w-full min-h-screen flex flex-col gap-2 p-2">
		<DrawerButton />
		<div class="flex justify-end items-center p-1 gap-4 min-h-[42px]">
			<ArchiveToggle bind:archiveMode />
		</div>
		{#if $getStorylinesInfinite.isLoading}
			<LoadingSpinner />
		{:else if $getStorylinesInfinite.isError}
			<InfoHeader
				emoji="🤕"
				heading="Oops!"
				description="Something went wrong while getting your storylines! Please try again later."
			/>
		{:else if storylines.length === 0}
			<InfoHeader
				emoji="🤲"
				heading="We've come up empty!"
				description="It looks like you don't have any {archiveMode
					? 'archived'
					: 'unarchived'} storylines."
			/>
		{:else}
			<div class="table-container min-w-full">
				<table class="table table-hover table-compact">
					<thead>
						<tr>
							<th>Cover</th>
							<th>Title</th>
							<th>Book</th>
							<th>Date Created</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{#each storylines as storyline}
							<tr>
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
								<RowActions
									{archiveMode}
									editCallback={() => openEditModal(storyline)}
									archiveCallback={() => openUnarchiveModal(storyline)}
									unarchiveCallback={() => openArchiveModal(storyline)}
								/>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if !$getStorylinesInfinite.hasNextPage}
				<ScrollToTopButton />
			{/if}
		{/if}
	</div>
</div>
