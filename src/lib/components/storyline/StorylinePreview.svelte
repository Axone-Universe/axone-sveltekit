<script lang="ts">
	import {
		type ModalComponent,
		type ModalSettings,
		getModalStore,
		getToastStore,
		type ToastSettings
	} from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { check, star, lock, edit, trash, bookmark, plus } from 'svelte-awesome/icons';

	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import type { UserProperties } from '$lib/properties/user';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import StorylineModal from './StorylineModal.svelte';
	import StorylineDetails from './StorylineDetails.svelte';
	import RowActions from '../studio/RowActions.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { BookProperties } from '$lib/properties/book';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import { deleteBucket } from '$lib/util/bucket/bucket';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { HydratedCampaignProperties } from '$lib/properties/campaign';
	import type { Response } from '$lib/util/types';
	import CampaignSelectionModal from './CampaignSelectionModal.svelte';

	export let storyline: HydratedDocument<StorylineProperties>;
	export let dispatchEvent: boolean = false;
	export let selected: boolean = false;
	export let addToReadingList:
		| undefined
		| ((names: string[], storylineID: string) => Promise<void>) = undefined;
	export let user: HydratedDocument<UserProperties> | undefined;
	export let showEdit = false;
	export let supabase: SupabaseClient | undefined = undefined;
	export let onUpdate: (() => void) | undefined = undefined;

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	// Make these reactive so they update when storyline prop changes
	$: storylineUser = storyline.user as UserProperties;
	$: book = storyline.book as BookProperties;

	let didError = false;

	const modalComponent: ModalComponent = {
		ref: StorylineModal,
		props: { storylineData: storyline, showEdit: showEdit }
	};

	const readingListModal: ModalSettings = {
		type: 'component',
		component: 'readingListModal',
		title: 'Add to Reading List',
		response: (r) => {
			if (r && addToReadingList) addToReadingList(r, storyline._id);
		}
	};

	const modal: ModalSettings = {
		type: 'component',
		component: modalComponent,
		response: (r) => {
			if (r) {
				readingListModal.meta = {
					user: user,
					storylineID: storyline._id
				};
				readingListModal.body = `Select the reading lists to add "${storyline.title}" to.`;
				modalStore.trigger(readingListModal);
			}
		}
	};

	const dispatch = createEventDispatcher();
	function clicked() {
		dispatch('selectedStoryline', storyline._id);
	}

	function openEditModal(storylineToEdit: HydratedDocument<StorylineProperties>) {
		const storylineDetailsModalComponent: ModalComponent = {
			ref: StorylineDetails,
			props: {
				book: storylineToEdit.book,
				storyline: storylineToEdit,
				supabase: supabase,
				cancelCallback: modalStore.close
			}
		};

		const storylineDetailsModal: ModalSettings = {
			type: 'component',
			component: storylineDetailsModalComponent,
			response: async (r) => {
				// After editing, refresh the storyline data
				if (r !== undefined) {
					await refreshStoryline();
				}
			}
		};

		modalStore.trigger(storylineDetailsModal);
	}

	async function refreshStoryline() {
		try {
			const response = await trpc($page).storylines.getById.query({
				id: storyline._id
			});

			if (response.success && response.data) {
				// Update the storyline with fresh data
				storyline = response.data as HydratedDocument<StorylineProperties>;
			}
		} catch (error) {
			console.error('Error refreshing storyline:', error);
		}
	}

	function openReadingListModal() {
		if (!user) {
			const toast: ToastSettings = {
				message: 'Please log in to add storylines to reading lists',
				background: 'variant-filled-warning'
			};
			toastStore.trigger(toast);
			return;
		}

		readingListModal.meta = {
			user: user,
			storylineID: storyline._id
		};
		readingListModal.body = `Select the reading lists to add "${storyline.title}" to.`;
		readingListModal.response = async (r) => {
			if (r) {
				await handleAddToReadingList(r);
			}
		};
		modalStore.trigger(readingListModal);
	}

	async function handleAddToReadingList(names: string[]) {
		try {
			const userResponse = await trpc($page).users.updateReadingLists.mutate({
				names,
				storylineID: storyline._id
			});

			if (userResponse.success) {
				// Update the user prop if possible
				if (user) {
					user = userResponse.data as HydratedDocument<UserProperties>;
				}

				const toast: ToastSettings = {
					message: `"${storyline.title}" added to reading list${names.length > 1 ? 's' : ''}!`,
					background: 'variant-filled-success'
				};
				toastStore.trigger(toast);
			} else {
				const toast: ToastSettings = {
					message: userResponse.message || 'Failed to add to reading list',
					background: 'variant-filled-error'
				};
				toastStore.trigger(toast);
			}
		} catch (error) {
			console.error(error);
			const toast: ToastSettings = {
				message: 'Error adding to reading list',
				background: 'variant-filled-error'
			};
			toastStore.trigger(toast);
		}
	}

	function deleteStoryline(storylineToDelete: HydratedDocument<StorylineProperties>) {
		const deleteModal: ModalSettings = {
			type: 'confirm',
			title: storylineToDelete.title,
			body: 'Are you sure you want to delete this storyline?',
			response: async (r: boolean) => {
				if (r) {
					try {
						const response = await trpc($page).storylines.delete.mutate({
							id: storylineToDelete._id
						});

						if (response.success) {
							let bookID =
								typeof storylineToDelete.book === 'string'
									? storylineToDelete.book
									: storylineToDelete.book?._id;

							if (supabase && bookID) {
								await deleteBucket({
									supabase: supabase,
									bucket: 'books',
									path: `${bookID}/storylines/${storylineToDelete._id}`
								});
							}

							if (onUpdate) {
								onUpdate();
							}
						}

						const toast: ToastSettings = {
							message: response.message,
							background: response.success ? 'variant-filled-success' : 'variant-filled-error'
						};
						toastStore.trigger(toast);
					} catch (error) {
						console.error(error);
						const toast: ToastSettings = {
							message: 'Error deleting storyline',
							background: 'variant-filled-error'
						};
						toastStore.trigger(toast);
					}
				}
			}
		};
		modalStore.trigger(deleteModal);
	}

	async function addStorylineToCampaign(campaignBook: any, selected: boolean) {
		const bookData = campaignBook as HydratedDocument<BookProperties>;

		let response: Response;

		if (selected) {
			response = await trpc($page).books.addStoryline.mutate({
				storylineID: storyline._id,
				bookID: bookData._id
			});
		} else {
			response = await trpc($page).books.removeStoryline.mutate({
				storylineID: storyline._id,
				bookID: bookData._id
			});
		}

		const toast: ToastSettings = {
			message: response.message,
			background: response.success ? 'variant-filled-success' : 'variant-filled-error'
		};
		toastStore.trigger(toast);
	}

	function showCampaigns() {
		// Fetch active campaigns
		trpc($page)
			.campaigns.get.query({
				limit: 100,
				open: true
			})
			.then((response) => {
				if (response.success && response.data && response.data.length > 0) {
					const campaigns = response.data as HydratedDocument<HydratedCampaignProperties>[];
					// Extract books from campaigns
					const campaignBooks = campaigns
						.map((c) => (typeof c.book === 'object' ? c.book : null))
						.filter((b) => b !== null) as HydratedDocument<BookProperties>[];

					// Check which campaigns already have this storyline
					const selectedCampaignBookIds = campaignBooks
						.filter((book) =>
							book.storylines?.some((s) => {
								const storylineId = typeof s === 'string' ? s : s._id;
								return storylineId === storyline._id;
							})
						)
						.map((book) => book._id);

					// Create modal with campaign selection component
					const campaignsModalComponent: ModalComponent = {
						ref: CampaignSelectionModal,
						props: {
							campaignBooks: campaignBooks,
							selectedCampaignBookIds: selectedCampaignBookIds,
							onSelect: addStorylineToCampaign
						}
					};

					const campaignsModal: ModalSettings = {
						type: 'component',
						component: campaignsModalComponent
					};

					modalStore.trigger(campaignsModal);
				} else {
					const toast: ToastSettings = {
						message: 'No active campaigns found',
						background: 'variant-filled-warning'
					};
					toastStore.trigger(toast);
				}
			})
			.catch((error) => {
				console.error(error);
				const toast: ToastSettings = {
					message: 'Error fetching campaigns',
					background: 'variant-filled-error'
				};
				toastStore.trigger(toast);
			});
	}
</script>

<button
	class={`card card-hover group rounded-md overflow-hidden w-full aspect-[2/3] relative cursor-pointer text-left text-white ${
		didError ? '' : 'bg-[url(/tail-spin.svg)] bg-no-repeat bg-center'
	} ${selected && 'p-1 !bg-primary-400'}`}
	on:click={dispatchEvent ? clicked : () => modalStore.trigger(modal)}
>
	{#if selected}
		<button
			class="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 btn-icon btn-icon-sm variant-filled-primary"
		>
			<Icon class="w-5 h-5" data={check} />
		</button>
	{/if}
	{#if user?.admin}
		<div class="absolute top-1 right-1 z-10">
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
					},
					{
						label: 'Save',
						icon: bookmark,
						callback: () => openReadingListModal()
					},
					{
						label: 'Campaign',
						icon: plus,
						callback: () => showCampaigns()
					}
				]}
			/>
		</div>
	{/if}
	<ImageWithFallback
		src={storyline.imageURL === '' ? book.imageURL : storyline.imageURL}
		alt={storyline.title ?? 'Storyline Title'}
		bind:didError
	/>
	<div
		class="bg-black/40 absolute top-0 w-full h-full md:bg-black/0 md:hover:bg-black/40 duration-300"
	>
		<div
			class="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex flex-col justify-between duration-300 p-2"
		>
			<p class="whitespace-normal text-sm sm:text-base font-bold line-clamp-2">{storyline.title}</p>
			<p class="whitespace-normal text-sm italic">
				{`by ${storylineUser?.firstName} ${storylineUser?.lastName}`}
			</p>
		</div>
	</div>
	{#if !storyline.userPermissions?.view}
		<div class="absolute items-center top-1/3 right-1/3">
			<Icon class="border-none !fill-[rgba(255,255,255,0.6)]" data={lock} scale={5} />
		</div>
	{/if}
	{#if storyline.numRatings > 0}
		<div
			class="overflow-hidden flex items-center absolute bottom-1 right-1 bg-white md:bg-black group-hover:bg-white py-1 px-2 space-x-1 rounded-full duration-300"
		>
			<Icon
				class="w-3 h-3 text-black md:text-white group-hover:text-black duration-300"
				data={star}
			/>
			<p
				class="text-xs font-bold line-clamp-1 text-black md:text-white group-hover:text-black duration-300"
			>
				{(storyline.cumulativeRating / storyline.numRatings).toFixed(1)}
			</p>
		</div>
	{/if}
	{#if book.campaign && storyline.main}
		<div
			class="overflow-hidden flex items-center absolute bottom-1 left-1 bg-white md:bg-orange-700 group-hover:bg-white py-1 px-2 space-x-1 rounded-full duration-300"
		>
			<p
				class="text-xs font-bold line-clamp-1 text-orange-700 md:text-white group-hover:text-orange-700 duration-300"
			>
				campaign
			</p>
		</div>
	{/if}
</button>
