<script lang="ts">
	import {
		type ModalComponent,
		type ModalSettings,
		getModalStore,
		getToastStore,
		type ToastSettings,
		popup,
		type PopupSettings
	} from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { check, star, lock, ellipsisV, edit, trash } from 'svelte-awesome/icons';

	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import type { UserProperties } from '$lib/properties/user';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import StorylineModal from './StorylineModal.svelte';
	import StorylineDetails from './StorylineDetails.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { BookProperties } from '$lib/properties/book';
	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import { deleteBucket } from '$lib/util/bucket/bucket';
	import type { SupabaseClient } from '@supabase/supabase-js';

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

	const popupSettings: PopupSettings = {
		event: 'click',
		target: `adminMenu-${storyline._id}`,
		placement: 'bottom'
	};

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

	async function openEditModal() {
		const storylineDetailsModalComponent: ModalComponent = {
			ref: StorylineDetails,
			props: {
				book: storyline.book,
				storyline,
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

	function deleteStoryline() {
		const deleteModal: ModalSettings = {
			type: 'confirm',
			title: storyline.title,
			body: 'Are you sure you want to delete this storyline?',
			response: async (r: boolean) => {
				if (r) {
					try {
						const response = await trpc($page).storylines.delete.mutate({
							id: storyline._id
						});

						if (response.success) {
							let bookID =
								typeof storyline.book === 'string' ? storyline.book : storyline.book?._id;

							if (supabase && bookID) {
								await deleteBucket({
									supabase: supabase,
									bucket: 'books',
									path: `${bookID}/storylines/${storyline._id}`
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
		<button
			class="absolute top-1 right-1 btn-icon btn-icon-sm variant-soft-surface z-10"
			use:popup={popupSettings}
			on:click|stopPropagation
		>
			<Icon class="w-4 h-4" data={ellipsisV} />
		</button>
		<div class="card p-2 w-40 shadow-xl z-20" data-popup={`adminMenu-${storyline._id}`}>
			<nav class="list-nav">
				<ul>
					<li>
						<button
							class="w-full text-left flex items-center gap-2 p-2 hover:variant-soft-primary rounded-md"
							on:click|stopPropagation={openEditModal}
						>
							<Icon class="w-4 h-4" data={edit} />
							<span>Edit</span>
						</button>
					</li>
					<li>
						<button
							class="w-full text-left flex items-center gap-2 p-2 hover:variant-soft-error rounded-md"
							on:click|stopPropagation={deleteStoryline}
						>
							<Icon class="w-4 h-4" data={trash} />
							<span>Delete</span>
						</button>
					</li>
				</ul>
			</nav>
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
