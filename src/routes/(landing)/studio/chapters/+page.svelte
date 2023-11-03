<script lang="ts">
	import { page } from '$app/stores';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
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
	let selectedChapters: HydratedDocument<ChapterProperties>[] = [];

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
			user: data.session?.user.id,
			archived: archiveMode
		},
		{
			queryKey: ['chaptersStudio', archiveMode],
			getNextPageParam: (lastPage) => lastPage.cursor
		}
	);

	$: chapters = $getChaptersInfinite?.data
		? ($getChaptersInfinite.data.pages.flatMap(
				(page) => page.result
		  ) as HydratedDocument<HydratedChapterProperties>[])
		: [];

	function openArchiveModal(chapters: HydratedDocument<ChapterProperties>[]) {
		if (chapters.length > 1) {
			archiveModal.body = `Are you sure you want to archive these ${chapters.length} chapters?`;
		} else {
			archiveModal.body = `Are you sure you want to archive ${chapters[0].title}?`;
		}

		archiveModal.response = async (r: boolean) => {
			if (r) {
				await setArchive(chapters, true);
				refetch();
			}
		};
		modalStore.trigger(archiveModal);
	}

	function openUnarchiveModal(chapters: HydratedDocument<ChapterProperties>[]) {
		if (chapters.length > 1) {
			unArchiveModal.body = `Are you sure you want to unarchive these ${chapters.length} chapters?`;
		} else {
			unArchiveModal.body = `Are you sure you want to unarchive ${chapters[0].title}?`;
		}

		unArchiveModal.response = async (r: boolean) => {
			if (r) {
				await setArchive(chapters, false);
				refetch();
			}
		};
		modalStore.trigger(unArchiveModal);
	}

	async function setArchive(chapters: HydratedDocument<ChapterProperties>[], archived: boolean) {
		const ids = chapters.map((c) => c._id);
		const resp = await trpc($page).chapters.setArchived.mutate({ ids, archived });
	}

	function openEditModal(chapter: HydratedDocument<ChapterProperties>) {
		chapterDetailsModalComponent.props = {
			chapter: chapter,
			bookID: chapter.book,
			storylineID: (chapter.storyline as HydratedDocument<StorylineProperties>)._id,
			cancelCallback: modalStore.close,
			createCallback: () => {
				refetch();
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

	async function refetch() {
		$getChaptersInfinite.remove();
		await $getChaptersInfinite.refetch();
		selectedChapters = [];
	}

	function handleChapterSelect(
		e: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		},
		chapter: HydratedDocument<ChapterProperties>
	) {
		if ((e.target as HTMLInputElement).checked) {
			if (!selectedChapters.includes(chapter)) {
				selectedChapters = [...selectedChapters, chapter];
			}
		} else {
			selectedChapters = selectedChapters.filter((s) => s !== chapter);
		}
	}
</script>

<svelte:window on:scroll={loadMore} />

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
						<th>Storyline</th>
						<th>Date Created</th>
						<th />
					</tr>
				</thead>
				<tbody>
					<tr>
						<td colspan="6">
							<div class="flex sm:justify-start sm:flex-row-reverse items-center gap-2 sm:gap-4">
								<ArchiveToggle bind:archiveMode />
								<span class="divider-vertical h-6 mx-0" />
								<button
									class="btn btn-sm variant-filled"
									disabled={selectedChapters.length === 0}
									on:click={() =>
										archiveMode
											? openUnarchiveModal(selectedChapters)
											: openArchiveModal(selectedChapters)}
								>
									{archiveMode ? 'Unarchive' : 'Archive'} Selected
								</button>
							</div>
						</td>
					</tr>
					{#if $getChaptersInfinite.isLoading}
						<tr>
							<td colspan="6">
								<LoadingSpinner />
							</td>
						</tr>
					{:else if $getChaptersInfinite.isError}
						<tr>
							<td colspan="6">
								<InfoHeader
									emoji="🤕"
									heading="Oops!"
									description="Something went wrong while getting your chapters! Please try again later."
								/>
							</td>
						</tr>
					{:else if chapters.length === 0}
						<tr>
							<td colspan="6">
								<InfoHeader
									emoji="🤲"
									heading="We're empty handed!"
									description="It looks like you don't have any {archiveMode
										? 'archived'
										: 'unarchived'} chapters."
								/>
							</td>
						</tr>
					{:else}
						{#each chapters as chapter}
							<tr>
								<td>
									<input
										class="checkbox"
										type="checkbox"
										on:change={(e) => handleChapterSelect(e, chapter)}
									/>
								</td>
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
									archiveCallback={() => openUnarchiveModal([chapter])}
									unarchiveCallback={() => openArchiveModal([chapter])}
								/>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		{#if !$getChaptersInfinite.hasNextPage}
			<ScrollToTopButton />
		{/if}
	</div>
</div>
