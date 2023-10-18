<script lang="ts">
	import { page } from '$app/stores';
	import { trpcWithQuery } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { PageData } from './$types';
	import type { HydratedStorylineProperties, StorylineProperties } from '$lib/properties/storyline';
	import type { ChapterProperties, HydratedChapterProperties } from '$lib/properties/chapter';
	import { decodeTime } from 'ulid';
	import { type ModalSettings, type ModalComponent, modalStore } from '@skeletonlabs/skeleton';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import StudioImage from '$lib/components/studio/StudioImage.svelte';
	import ArchiveToggle from '$lib/components/studio/ArchiveToggle.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import { getArchiveModal, getUnarchiveModal } from '$lib/util/studio/modals';
	import { formattedDate } from '$lib/util/studio/strings';
	import RowActions from '$lib/components/studio/RowActions.svelte';
	import DrawerButton from '$lib/components/studio/DrawerButton.svelte';
	import { goto } from '$app/navigation';
	import { debouncedScrollCallback } from '$lib/util/debouncedCallback';
	import ScrollToTopButton from '$lib/components/util/ScrollToTopButton.svelte';

	const archiveModal = getArchiveModal();
	const unArchiveModal = getUnarchiveModal();

	export let data: PageData;

	let archiveMode: boolean = false;
	let lastLoadEpoch = 0;

	const chapterDetailsModalComponent: ModalComponent = {
		ref: ChapterDetailsModal
	};

	const chapterDetailsModal: ModalSettings = {
		type: 'component',
		component: chapterDetailsModalComponent
	};

	const editChapterModal: ModalSettings = {
		type: 'confirm',
		title: 'Confirm Edit'
	};

	$: getChaptersInfinite = trpcWithQuery($page).chapters.get.createInfiniteQuery(
		{
			limit: 10,
			user: data.session?.user.id
		},
		{
			queryKey: ['chaptersStudio', data.session?.user.id],
			getNextPageParam: (lastPage) => lastPage.cursor
		}
	);

	$: chapters = $getChaptersInfinite?.data
		? ($getChaptersInfinite.data.pages.flatMap(
				(page) => page.result
		  ) as HydratedDocument<HydratedChapterProperties>[])
		: [];

	function openArchiveModal(chapter: HydratedDocument<ChapterProperties>) {
		archiveModal.body = `Are you sure you want to archive ${chapter.title}?`;
		modalStore.trigger(archiveModal);
	}

	function openUnarchiveModal(chapter: HydratedDocument<ChapterProperties>) {
		unArchiveModal.body = `Are you sure you want to unarchive ${chapter.title}?`;
		modalStore.trigger(unArchiveModal);
	}

	function openEditModal(chapter: HydratedDocument<ChapterProperties>) {
		chapterDetailsModalComponent.props = {
			chapter: chapter,
			bookID: chapter.book,
			storylineID: (chapter.storyline as HydratedDocument<StorylineProperties>)._id,
			cancelCallback: modalStore.close,
			createCallback: () => {
				$getChaptersInfinite.remove();
				$getChaptersInfinite.refetch();
				modalStore.close();
			},
			class: 'flex flex-col space-y-4 items-center'
		};
		modalStore.trigger(chapterDetailsModal);
	}

	function openEditChapterModal(chapter: HydratedDocument<ChapterProperties>) {
		editChapterModal.body = `Would you like to edit ${chapter.title}?`;
		editChapterModal.response = (r: boolean) => {
			if (r) {
				goto(
					`/editor/${chapter.book}?mode=writer&storylineID=${
						(chapter.storyline as HydratedStorylineProperties)._id
					}&chapterID=${chapter._id}`
				);
			}
		};

		modalStore.trigger(editChapterModal);
	}

	function getImageURL(chapter: HydratedDocument<HydratedChapterProperties>): string | undefined {
		return chapter.storyline?.imageURL;
	}

	function loadMore() {
		lastLoadEpoch = debouncedScrollCallback(lastLoadEpoch, $getChaptersInfinite.fetchNextPage);
	}
</script>

<svelte:window on:scroll={loadMore} />

<div class="min-h-screen w-full overflow-hidden">
	{#if $getChaptersInfinite.isLoading}
		<LoadingSpinner />
	{:else if $getChaptersInfinite.isError}
		<InfoHeader
			emoji="🤕"
			heading="Oops!"
			description="Something went wrong while getting your chapters! Please try again later."
		/>
	{:else if chapters.length === 0}
		<InfoHeader
			emoji="🤲"
			heading="We've come up empty!"
			description="It looks like you haven't created any chapters."
		/>
	{:else}
		<div class="w-full flex flex-col gap-2 p-2">
			<DrawerButton />
			<div class="flex justify-end items-center p-1 gap-4 min-h-[42px]">
				<ArchiveToggle bind:archiveMode />
			</div>
			<div class="table-container min-w-full">
				<table class="table table-hover table-compact">
					<thead>
						<tr>
							<th>Cover</th>
							<th>Title</th>
							<th>Storyline</th>
							<th>Date Created</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{#each chapters as chapter}
							<tr>
								<td>
									<StudioImage
										src={getImageURL(chapter) ?? ''}
										alt={chapter.title ?? ''}
										buttonCallback={() => openEditChapterModal(chapter)}
									/>
								</td>
								<td>{chapter.title}</td>
								<td>
									{#if chapter.storyline}
										{chapter.storyline.title}
									{/if}
								</td>
								<td>{formattedDate(new Date(decodeTime(chapter._id)))}</td>
								<RowActions
									{archiveMode}
									editCallback={() => openEditModal(chapter)}
									archiveCallback={() => openUnarchiveModal(chapter)}
									unarchiveCallback={() => openArchiveModal(chapter)}
								/>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if !$getChaptersInfinite.hasNextPage}
				<ScrollToTopButton />
			{/if}
		</div>
	{/if}
</div>
