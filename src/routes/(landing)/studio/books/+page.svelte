<script lang="ts">
	import { page } from '$app/stores';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { PageData } from './$types';
	import { BookPropertyBuilder, type BookProperties } from '$lib/properties/book';
	import { decodeTime } from 'ulid';
	import { plus } from 'svelte-awesome/icons';
	import { Icon } from 'svelte-awesome';
	import { type ModalSettings, modalStore, type ModalComponent } from '@skeletonlabs/skeleton';
	import BookDetails from '$lib/components/book/BookDetails.svelte';
	import InfoHeader from '$lib/components/InfoHeader.svelte';
	import StudioImage from '$lib/components/studio/StudioImage.svelte';
	import ArchiveToggle from '$lib/components/studio/ArchiveToggle.svelte';
	import LoadingSpinner from '$lib/components/util/LoadingSpinner.svelte';
	import { getArchiveModal, getUnarchiveModal } from '$lib/util/studio/modals';
	import { formattedDate } from '$lib/util/studio/strings';
	import RowActions from '$lib/components/studio/RowActions.svelte';
	import DrawerButton from '$lib/components/studio/DrawerButton.svelte';
	import BookModal from '$lib/components/book/BookModal.svelte';
	import { debouncedScrollCallback } from '$lib/util/debouncedCallback';
	import ScrollToTopButton from '$lib/components/util/ScrollToTopButton.svelte';

	const archiveModal = getArchiveModal();
	const unArchiveModal = getUnarchiveModal();

	export let data: PageData;

	let archiveMode: boolean = false;
	let lastLoadEpoch = 0;

	const bookDetailsModalComponent: ModalComponent = {
		ref: BookDetails
	};
	const bookDetailsModal: ModalSettings = {
		type: 'component',
		component: bookDetailsModalComponent
	};

	const bookModalComponent: ModalComponent = {
		ref: BookModal
	};
	const bookModal: ModalSettings = {
		type: 'component',
		component: bookModalComponent
	};

	// TODO: add archiveMode to query when respective backend logic is done
	$: getBooksInfinite = trpcWithQuery($page).books.get.createInfiniteQuery(
		{
			limit: 10,
			user: data.session?.user.id,
			genres: [],
			archived: archiveMode
		},
		{
			queryKey: ['booksStudio', archiveMode],
			getNextPageParam: (lastPage) => lastPage.cursor
		}
	);

	$: books = $getBooksInfinite.data
		? ($getBooksInfinite.data.pages.flatMap(
				(page) => page.result
		  ) as HydratedDocument<BookProperties>[])
		: [];

	function openArchiveModal(book: HydratedDocument<BookProperties>) {
		archiveModal.body = `Are you sure you want to archive ${book.title}?`;
		archiveModal.response = async (r: boolean) => {
			if (r) {
				await setArchive(book._id, true);
				refetch();
			}
		};
		modalStore.trigger(archiveModal);
	}

	function openUnarchiveModal(book: HydratedDocument<BookProperties>) {
		unArchiveModal.body = `Are you sure you want to unarchive ${book.title}?`;
		unArchiveModal.response = async (r: boolean) => {
			if (r) {
				await setArchive(book._id, false);
				refetch();
			}
		};
		modalStore.trigger(unArchiveModal);
	}

	async function setArchive(id: string, archived: boolean) {
		const resp = await trpc($page).books.setArchived.mutate({ id, archived });
	}

	function openCreateModal() {
		const bookPropertyBuilder = new BookPropertyBuilder();

		bookDetailsModalComponent.props = {
			book: bookPropertyBuilder.getProperties(),
			supabase: data.supabase,
			cancelCallback: modalStore.close,
			createCallback: () => {
				refetch();
				modalStore.close();
			}
		};
		modalStore.trigger(bookDetailsModal);
	}

	function openEditModal(book: HydratedDocument<BookProperties>) {
		bookDetailsModalComponent.props = {
			book,
			supabase: data.supabase,
			cancelCallback: modalStore.close,
			createCallback: () => {
				refetch();
				modalStore.close();
			}
		};
		modalStore.trigger(bookDetailsModal);
	}

	function openBookModal(book: HydratedDocument<BookProperties>) {
		bookModalComponent.props = {
			book,
			session: data.session
		};
		modalStore.trigger(bookModal);
	}

	function loadMore() {
		lastLoadEpoch = debouncedScrollCallback(lastLoadEpoch, $getBooksInfinite.fetchNextPage);
	}

	async function refetch() {
		$getBooksInfinite.remove();
		await $getBooksInfinite.refetch();
	}
</script>

<svelte:window on:scroll={loadMore} />

<div class="min-h-screen overflow-hidden w-full">
	<div class="w-full min-h-screen flex flex-col gap-2 p-2">
		<DrawerButton />

		<div class="table-container min-w-full">
			<table class="table table-hover table-compact">
				<thead>
					<tr>
						<th>Cover</th>
						<th>Title</th>
						<th>Description</th>
						<th>Date Created</th>
						<th />
					</tr>
				</thead>
				<tbody>
					<tr>
						<td colspan="5">
							<div class="flex justify-end items-center p-1 gap-4 min-h-[42px]">
								<ArchiveToggle bind:archiveMode />
								<span class="divider-vertical h-6 mx-0" />
								<button
									type="button"
									class="btn-icon btn-icon-sm variant-filled-primary"
									on:click={openCreateModal}
								>
									<span><Icon data={plus} /></span>
								</button>
							</div>
						</td>
					</tr>
					{#if $getBooksInfinite.isLoading}
						<tr>
							<td colspan="5">
								<LoadingSpinner />
							</td>
						</tr>
					{:else if $getBooksInfinite.isError}
						<tr>
							<td colspan="5">
								<InfoHeader
									emoji="🤕"
									heading="Oops!"
									description="Something went wrong while getting your books! Please try again later."
								/>
							</td>
						</tr>
					{:else if books.length === 0}
						<tr>
							<td colspan="5">
								<InfoHeader
									emoji="🤲"
									heading="We've come up empty!"
									description="It looks like you don't have any {archiveMode
										? 'archived'
										: 'unarchived'} books."
								/>
							</td>
						</tr>
					{:else}
						{#each books as book}
							<tr>
								<td>
									<StudioImage
										src={book.imageURL}
										alt={book.title}
										buttonCallback={() => openBookModal(book)}
									/>
								</td>
								<td>{book.title}</td>
								<td class="max-w-sm !min-w-[16rem] !whitespace-normal break-words">
									{book.description}
								</td>
								<td>
									{formattedDate(new Date(decodeTime(book._id)))}
								</td>
								<RowActions
									{archiveMode}
									editCallback={() => openEditModal(book)}
									archiveCallback={() => openUnarchiveModal(book)}
									unarchiveCallback={() => openArchiveModal(book)}
								/>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		{#if !$getBooksInfinite.hasNextPage}
			<ScrollToTopButton />
		{/if}
	</div>
</div>
