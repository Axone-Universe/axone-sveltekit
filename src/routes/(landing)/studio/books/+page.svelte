<script lang="ts">
	import { page } from '$app/stores';
	import { trpc, trpcWithQuery } from '$lib/trpc/client';
	import type { HydratedDocument } from 'mongoose';
	import type { PageData } from './$types';
	import { BookPropertyBuilder, type BookProperties } from '$lib/properties/book';
	import { decodeTime } from 'ulid';
	import { arrowDown, bell, book, edit, plus, trash } from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import {
		type ModalSettings,
		type ModalComponent,
		type ToastSettings,
		getToastStore,
		getModalStore
	} from '@skeletonlabs/skeleton';
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
	import ArchiveSelectedButton from '$lib/components/studio/ArchiveSelectedButton.svelte';
	import CreateBookModal from '$lib/components/studio/CreateBookModal.svelte';
	import ViewFilters from '$lib/components/studio/ViewFilters.svelte';
	import CampaignDetails from '$lib/components/campaign/CampaignDetails.svelte';
	import { CampaignPropertyBuilder } from '$lib/properties/campaign';
	import Tutorial from './tutorial.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { deleteBucket } from '$lib/util/bucket/bucket';
	import NotificationForm from '$lib/components/notifications/NotificationForm.svelte';

	const archiveModal = getArchiveModal();
	const unArchiveModal = getUnarchiveModal();

	export let data: PageData;
	const { supabase } = data;

	let archiveMode: boolean = false;
	let selectedBooks: HydratedDocument<BookProperties>[] = [];

	const toastStore = getToastStore();
	const modalStore = getModalStore();

	$: isCampaigns = $page.url.searchParams.get('campaigns') === 'true' ? true : false;

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

	const notificationModalComponent: ModalComponent = {
		ref: NotificationForm
	};
	const notificationModal: ModalSettings = {
		type: 'component',
		component: notificationModalComponent
	};

	const createBookModalComponent: ModalComponent = {
		ref: CreateBookModal,
		props: {
			bookCallback: () => {
				modalStore.close();
				openCreateBookModal();
			},
			campaignCallback: () => {
				modalStore.close();
				openCreateCampaignModal();
			}
		}
	};
	const createBookModal: ModalSettings = {
		type: 'component',
		component: createBookModalComponent
	};

	const campaignDetailsComponent: ModalComponent = {
		ref: CampaignDetails
	};

	const campaignDetailsModal: ModalSettings = {
		type: 'component',
		component: campaignDetailsComponent
	};

	// TODO: add archiveMode to query when respective backend logic is done
	$: getBooksInfinite = trpcWithQuery($page).books.get.createInfiniteQuery(
		{
			limit: 10,
			user: data.session?.user.id,
			genres: [],
			tags: isCampaigns ? ['Campaigns'] : ['Books'],
			archived: archiveMode
		},
		{
			queryKey: ['booksStudio', archiveMode, isCampaigns ? '' : null],
			getNextPageParam: (lastPage: { cursor: any }) => lastPage.cursor
		}
	);

	$: books = $getBooksInfinite.data
		? ($getBooksInfinite.data.pages.flatMap(
				(page) => page.data
		  ) as HydratedDocument<BookProperties>[])
		: [];

	function openArchiveModal(books: HydratedDocument<BookProperties>[]) {
		if (books.length > 1) {
			archiveModal.body = `Are you sure you want to archive these ${books.length} books? Doing so will archive all the storylines and chapters you've created for them too.`;
		} else {
			archiveModal.body = `Are you sure you want to archive ${books[0].title}? Doing so will archive all the storylines and chapters you've created for it too.`;
		}

		archiveModal.response = async (r: boolean) => {
			if (r) {
				await setArchive(books, true);
				refetch();
			}
		};
		modalStore.trigger(archiveModal);
	}

	function openUnarchiveModal(books: HydratedDocument<BookProperties>[]) {
		if (books.length > 1) {
			unArchiveModal.body = `Are you sure you want to unarchive these ${books.length} books? Doing so will unarchive all the storylines and chapters you've created for them too.`;
		} else {
			unArchiveModal.body = `Are you sure you want to unarchive ${books[0].title}? Doing so will unarchive all the storylines and chapters you've created for it too.`;
		}

		unArchiveModal.response = async (r: boolean) => {
			if (r) {
				await setArchive(books, false);
				refetch();
			}
		};
		modalStore.trigger(unArchiveModal);
	}

	async function setArchive(books: HydratedDocument<BookProperties>[], archived: boolean) {
		const ids = books.map((b) => b._id);
		const resp = await trpc($page).books.setArchived.mutate({ ids, archived });
	}

	function openCreateBookModal() {
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

	function openCreateCampaignModal() {
		const bookPropertyBuilder = new BookPropertyBuilder();
		const campaignPropertyBuilder = new CampaignPropertyBuilder();

		campaignDetailsComponent.props = {
			book: bookPropertyBuilder.getProperties(),
			campaign: campaignPropertyBuilder.getProperties(),
			supabase: data.supabase,
			cancelCallback: modalStore.close,
			createCallback: () => {
				isCampaigns = true;
				refetch();
				modalStore.close();
			}
		};
		modalStore.trigger(campaignDetailsModal);
	}

	function openUpdateCampaignModal(book: HydratedDocument<BookProperties>) {
		campaignDetailsComponent.props = {
			book,
			campaign: book.campaign,
			supabase: data.supabase,
			cancelCallback: modalStore.close,
			createCallback: () => {
				isCampaigns = true;
				refetch();
				modalStore.close();
			}
		};
		modalStore.trigger(campaignDetailsModal);
	}

	function openEditModal(book: HydratedDocument<BookProperties>) {
		if (book.campaign) {
			openUpdateCampaignModal(book);
			return;
		}

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

	function openNotificationModal(book: HydratedDocument<BookProperties>) {
		notificationModalComponent.props = {
			book,
			cancelCallback: modalStore.close
		};
		modalStore.trigger(notificationModal);
	}

	function loadMore() {
		$getBooksInfinite.fetchNextPage();
	}

	async function refetch() {
		await $getBooksInfinite.refetch();
		selectedBooks = [];
	}

	function handleBookSelect(
		e: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		},
		book: HydratedDocument<BookProperties>
	) {
		if ((e.target as HTMLInputElement).checked) {
			if (!selectedBooks.includes(book)) {
				selectedBooks = [...selectedBooks, book];
			}
		} else {
			selectedBooks = selectedBooks.filter((s) => s !== book);
		}
	}

	function deleteBook(bookToDelete: HydratedDocument<BookProperties>) {
		const modal: ModalSettings = {
			type: 'confirm',
			// Data
			title: bookToDelete.title,
			body: 'Are you sure you want to delete this book?',
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r) {
					trpc($page)
						.books.delete.mutate({
							id: bookToDelete._id
						})
						.then(async (response) => {
							if (response.success) {
								await deleteBucket({
									supabase: supabase,
									bucket: 'books',
									path: bookToDelete._id
								});
								books = books.filter((book) => book._id !== bookToDelete._id);
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

<Tutorial />

<div class="min-h-screen overflow-hidden w-full">
	<div class="w-full min-h-screen flex flex-col gap-2">
		<div class="table-container min-w-full">
			<table class="table table-hover table-compact relative">
				<thead>
					<tr>
						<th />
						<th>Cover</th>
						<th>Title</th>
						<th>Description</th>
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
								{#if isCampaigns}
									<Tooltip
										on:click={openCreateCampaignModal}
										content="Create new campaign"
										placement="top"
										target="create-campaign-btn"
									>
										<button id="create-btn" type="button" class="btn btn-sm variant-filled-primary">
											<span class="px-2"><Icon data={edit} /></span>
										</button>
									</Tooltip>
								{:else}
									<Tooltip
										on:click={openCreateBookModal}
										content="Create new book"
										placement="top"
										target="create-book-btn"
									>
										<button id="create-btn" type="button" class="btn btn-sm variant-filled-primary">
											<span class="px-2"><Icon data={book} /></span>
										</button>
									</Tooltip>
								{/if}
								<span class="divider-vertical h-6 mx-0" />
								<ArchiveSelectedButton
									selected={selectedBooks}
									{archiveMode}
									{openArchiveModal}
									{openUnarchiveModal}
								/>
							</div>
						</td>
					</tr>
					{#if $getBooksInfinite.isLoading}
						<tr>
							<td colspan="6">
								<LoadingSpinner />
							</td>
						</tr>
					{:else if $getBooksInfinite.isError}
						<tr>
							<td colspan="6">
								<InfoHeader
									emoji="🤕"
									heading="Oops!"
									description="Something went wrong while getting your books! Please try again later."
								/>
							</td>
						</tr>
					{:else if books.length === 0}
						<tr>
							<td colspan="6">
								<InfoHeader
									emoji="🤲"
									heading="We're empty handed!"
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
									<input
										class="checkbox"
										type="checkbox"
										on:change={(e) => handleBookSelect(e, book)}
									/>
								</td>
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
								<td>
									<RowActions
										document={book}
										rowActions={[
											{
												label: 'Edit',
												icon: edit,
												callback: openEditModal
											},
											{
												label: 'Delete',
												icon: trash,
												callback: deleteBook
											},
											...(isCampaigns
												? [{ label: 'Notify', icon: bell, callback: openNotificationModal }]
												: [])
										]}
									/>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		{#if $getBooksInfinite.hasNextPage}
			<div class="flex justify-center my-2">
				<Tooltip on:click={loadMore} content="Load more" placement="top" target="reading-list">
					<button class="btn-icon variant-filled">
						<Icon data={arrowDown} />
					</button>
				</Tooltip>
			</div>
		{/if}
	</div>
</div>
