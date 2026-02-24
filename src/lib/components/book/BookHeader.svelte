<script lang="ts">
	import type { BookProperties, HydratedBookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import {
		star,
		infoCircle,
		bookmark,
		plus,
		pencil,
		leanpub,
		warning,
		calendar,
		tag,
		checkCircle,
		trophy,
		share,
		gear
	} from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { afterUpdate, createEventDispatcher, onMount } from 'svelte';
	import { type StorylineProperties } from '$lib/properties/storyline';
	import CampaignDetails from '$lib/components/campaign/CampaignDetails.svelte';
	import {
		type PopupSettings,
		popup,
		type ModalSettings,
		getModalStore,
		type ModalComponent,
		Accordion,
		AccordionItem,
		modeCurrent,
		getToastStore,
		type ToastSettings,
		Avatar
	} from '@skeletonlabs/skeleton';
	import type { Genre } from '$lib/properties/genre';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { Confetti } from 'svelte-confetti';

	import { page } from '$app/stores';
	import type { UserProperties } from '$lib/properties/user';
	import { trpc } from '$lib/trpc/client';
	import type { Session } from '@supabase/supabase-js';
	import DocumentCarousel from '../documents/DocumentCarousel.svelte';
	import { formattedDate } from '$lib/util/studio/strings';
	import { documentURL } from '$lib/util/links';
	import ShareSocialModal from '$lib/components/documents/ShareSocialModal.svelte';
	import { type PermissionedDocument } from '$lib/properties/permission';
	import DocumentsInfiniteScroll from '../documents/DocumentsInfiniteScroll.svelte';
	import { type Response } from '$lib/util/types';
	import { campaignDaysLeft } from '$lib/util/constants';

	let customClass = '';

	export { customClass as class };
	export let bookData: HydratedDocument<HydratedBookProperties>;
	export let storylines: { [key: string]: HydratedDocument<StorylineProperties> } = {};
	export let session: Session | null;
	export let storylineData: HydratedDocument<StorylineProperties>;
	export let supabase: any;

	let bookGenres: Genre[] | undefined;
	let user: HydratedDocument<UserProperties> | undefined = undefined;
	let winners: HydratedDocument<UserProperties>[] = [];

	const modalStore = getModalStore();
	const toastStore = getToastStore();
	const modalComponent: ModalComponent = {
		ref: ShareSocialModal,
		props: {
			title: bookData.campaign
				? 'Join this writing competition on Axone Universe!'
				: 'Checkout this book on Axone Universe!',
			url: documentURL($page.url.origin, 'Book', bookData),
			body: "Are you an avid reader? Join the Axone community and read free books online! If you're an author, join our writing competitions and win every month!"
		}
	};

	const modal: ModalSettings = {
		type: 'component',
		component: modalComponent
	};

	onMount(() => {
		user = $page.data.user;
		fetchWinners();
	});

	afterUpdate(() => {
		bookGenres = bookData.genres;
	});

	const infoPopup: PopupSettings = {
		// Represents the type of event that opens/closed the popup
		event: 'click',
		// Matches the data-popup value on your popup element
		target: 'infoPopup',
		// Defines which side of your trigger the popup will appear
		placement: 'top'
	};

	const readingListModal: ModalSettings = {
		type: 'component',
		component: 'readingListModal',
		title: 'Add to Reading List',
		response: (r) => {
			if (r) addToReadingList(r);
		}
	};

	const campaignDetailsComponent: ModalComponent = {
		ref: CampaignDetails
	};

	const campaignDetailsModal: ModalSettings = {
		type: 'component',
		component: campaignDetailsComponent
	};

	$: selectedStoryline = storylineData;
	const storylinesPopup: PopupSettings = {
		event: 'click',
		target: 'storylinesPopup',
		placement: 'bottom',
		closeQuery: '.listbox-item'
	};

	let dispatch = createEventDispatcher();
	function handleSelected(event: { detail: any }) {
		if (event.detail) {
			storylineData = storylines[event.detail];
			dispatch('selectedStoryline', event.detail);
		}
	}

	/**
	 * Only called for campaigns
	 */
	async function fetchWinners() {
		if (bookData.campaign && bookData.campaign.winners) {
			const users = (
				await trpc($page).users.getByIds.query({
					ids: bookData.campaign.winners as string[]
				})
			).data;

			if (users) {
				winners = users as HydratedDocument<UserProperties>[];
			}
		}
	}

	function openReadingListModal() {
		readingListModal.meta = {
			user,
			storylineID: selectedStoryline!._id
		};
		readingListModal.body = `Select the reading lists to add "${selectedStoryline!.title}" to.`;
		modalStore.trigger(readingListModal);
	}

	function copyLink() {
		const link = documentURL($page.url.origin, 'Book', bookData);
		navigator.clipboard.writeText(link);

		const t: ToastSettings = {
			message: `${bookData.campaign ? 'Campaign' : 'Book'} link copied`,
			background: 'variant-filled-success'
		};
		toastStore.trigger(t);
		modalStore.trigger(modal);
	}

	let modalSettings: ModalSettings = {
		type: 'component',
		component: modalComponent,
		response: () => {}
	};

	async function addStoryline(arg: any, selected: boolean) {
		let response: Response;
		let storyline = arg as HydratedDocument<StorylineProperties>;

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

		if (response.success) {
			if (selected) {
				storylines[storyline._id] = storyline;
			} else {
				delete storylines[storyline._id];
				storylines = storylines;
			}

			bookData.storylines = (response.data as HydratedDocument<BookProperties>).storylines;

			modalComponent.props!['selectedDocuments'] = bookData.storylines;
			modalStore.close();
			modalStore.trigger(modalSettings);
		}

		const t: ToastSettings = {
			message: response.message,
			background: response.success ? 'variant-filled-success' : 'variant-filled-error'
		};
		toastStore.trigger(t);
	}

	let showStorylines = () => {
		modalComponent.ref = DocumentsInfiniteScroll;
		modalComponent.props = {
			documentType: 'Storyline' as PermissionedDocument,
			documents: Object.values(storylines),
			parameters: { user: session ? session.user.id : ' ' },
			action: {
				id: 'create-storyline',
				label: 'New Storyline',
				icon: plus,
				callback: () => {
					window.open(`/storyline/create?bookID=${bookData._id}`, '_blank');
				},
				mode: 'writer'
			},
			class: 'md:!w-modal rounded-lg variant-filled max-h-[600px] overflow-auto p-4',
			gridStyle: 'grid-cols-2 md:grid-cols-4',
			limit: 4,
			title: 'Select or create a storyline',
			dispatchEvent: true,
			selectedDocuments: bookData.storylines,
			callback: addStoryline
		};
		modalStore.trigger(modalSettings);
	};

	async function addToReadingList(names: string[]) {
		try {
			user = (
				await trpc($page).users.updateReadingLists.mutate({
					names,
					storylineID: selectedStoryline!._id
				})
			).data as HydratedDocument<UserProperties>;
		} catch (e) {
			console.log(e);
		}
	}
</script>

<div
	class={`bg-center bg-no-repeat bg-cover rounded-lg ${customClass}`}
	style="background-image: url({storylineData.imageURL !== ''
		? storylineData.imageURL
		: bookData.imageURL})"
>
	<div
		class="rounded-lg bg-gradient-to-b {$modeCurrent ? 'from-white/70' : 'from-black/70'} from-10%
        [.dark_&]:via-[rgba(var(--color-surface-900))] via-[rgba(var(--color-surface-50))] via-70%
        [.dark_&]:to-[rgba(var(--color-surface-900))] to-[rgba(var(--color-surface-50))]
        w-full space-x-4 h-full"
	>
		<div class="md:px-10 pt-4 md:pt-60 overflow-hidden space-y-4 relative">
			{#if bookData.campaign}
				<div
					class="absolute top-4 right-4 flex h-fit items-center bg-orange-700 py-1 px-2 rounded-full"
				>
					<p class="text-sm md:text-md font-bold text-white">campaign</p>
				</div>
			{/if}
			<div class="p-2 space-y-4">
				<div class="flex flex-col items-center p-2">
					<p class="book-title text-2xl md:text-4xl font-bold relative text-center">
						{storylineData.title}
						<button
							use:popup={infoPopup}
							class="badge-icon z-10 variant-filled absolute -top-3 -right-5"
							><Icon class="top-0 cursor-pointer icon-info" data={infoCircle} scale={1.5} />
						</button>
					</p>
				</div>
				<div class="flex flex-col md:p-2 space-x-4 w-full items-center">
					<div class="flex flex-row items-center w-full gap-4">
						{#if Object.values(storylines).length > 1}
							<div class="flex flex-col w-full items-center">
								<p class="book-title text-l md:text-xl text-center">
									{bookData.title}
								</p>
							</div>
						{/if}
						<div class="card p-4 w-2/4 shadow-xl" data-popup="infoPopup">
							<div class="space-y-4">
								<div>
									<p class="font-bold">Storylines</p>
									<p class="opacity-50">@Storyline</p>
								</div>
								<p>
									Storylines are alternative trajectories of the book or campaign stemming from the
									main storyline.
								</p>

								{#if bookData.campaign}
									<p>
										You can participate in a campaign by creating your own storyline that aligns
										with the campaign objectives and criteria. Click on the '+' button below to do
										that.
									</p>
								{:else}
									<p>
										You can create a new storyline by going to the chapters section below and
										clicking on the green '+' next to a chapter.
									</p>
								{/if}

								<a class="btn variant-soft w-full" href="/learn" target="_blank" rel="noreferrer">
									More
								</a>
							</div>
							<div class="arrow bg-surface-100-800-token" style="left: 140px; bottom: -4px;" />
						</div>
					</div>

					{#if Object.values(storylines).length > 1}
						<DocumentCarousel
							on:selectedStoryline={handleSelected}
							documentType="Storyline"
							documents={Object.values(storylines)}
							{user}
							{supabase}
						/>
					{/if}
				</div>

				<div class="space-x-2 line-clamp-1">
					{#if bookGenres}
						{#each bookGenres as genre}
							<div class="chip variant-filled">{genre}</div>
						{/each}
					{/if}
				</div>

				<hr class="opacity-50" />

				<div class="flex flex-row items-center space-x-2">
					{#if selectedStoryline.chapters && selectedStoryline.chapters.length > 0}
						<a
							id="read-btn"
							href="/editor/{bookData._id}?mode=reader&storylineID={selectedStoryline._id}"
							class="btn variant-filled py-1"
						>
							<Icon class="p-2" data={leanpub} scale={2.5} />
							Read
						</a>
					{/if}

					{#if !storylineData._id || (bookData.userPermissions?.collaborate && bookData.campaign)}
						<Tooltip
							on:click={() => {
								if (campaignDaysLeft(bookData.campaign)[0] >= 0) showStorylines();
							}}
							content="Submit or create a new storyline!"
							placement="top"
							target="create-storyline"
						>
							<button
								id="join-btn"
								class="gap-2 text-white font-semibold btn {bookData.campaign
									? 'bg-orange-700'
									: 'variant-filled-primary'}"
								disabled={campaignDaysLeft(bookData.campaign)[0] < 0}
							>
								<Icon class="top-0 cursor-pointer !fill-white" data={plus} scale={1} />
								Join
							</button>
						</Tooltip>
					{/if}
					{#if session}
						<Tooltip
							on:click={openReadingListModal}
							content="Add to reading list"
							placement="top"
							target="reading-list"
						>
							<button id="reading-list-btn" class="btn-icon variant-filled">
								<Icon class="p-2" data={bookmark} scale={2.5} />
							</button>
						</Tooltip>
					{/if}
					{#if selectedStoryline?.userPermissions?.collaborate}
						<Tooltip
							on:click={() => {
								window.open(
									`/editor/${bookData._id}?storylineID=${selectedStoryline?._id}&mode=writer`,
									'_blank'
								);
							}}
							content="Edit storyline"
							placement="top"
							target="edit-storyline"
						>
							<button id="edit-storyline-btn" class="btn-icon variant-filled">
								<Icon class="p-2" data={pencil} scale={2.5} />
							</button>
						</Tooltip>
					{/if}
					<Tooltip on:click={copyLink} content="Share" placement="top" target="share-btn">
						<button id="share-btn" class="btn-icon variant-filled-primary">
							<Icon class="p-2" data={share} scale={2.3} />
						</button>
					</Tooltip>

					{#if storylineData.numRatings > 0}
						<div class="overflow-hidden flex items-center">
							<Icon class="p-2" data={star} scale={2} />
							<p class="text-lg font-bold">{storylineData.numRatings}</p>
						</div>
					{/if}
					{#if bookData.campaign}
						<div class="flex items-center w-full justify-end gap-x-2">
							<div
								class="flex h-fit items-center {campaignDaysLeft(
									bookData.campaign
								)[1]} py-1 px-2 rounded-full"
							>
								<p class="flex items-center !py-0 text-sm md:text-md font-bold text-white">
									{#if campaignDaysLeft(bookData.campaign)[0] > 0}
										<Icon class="p-2  !hidden md:!block" data={calendar} scale={2} />
										{campaignDaysLeft(bookData.campaign)[0]} days left
									{:else}
										<Icon class="p-2 !hidden md:!block" data={warning} scale={2} />
										Closed
									{/if}
								</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
			<hr class="opacity-50" />
			<Accordion>
				{#if winners.length > 0}
					<div
						style="position: fixed; top: -50px; left: 0; height: 100vh; width: 100vw; display: flex; justify-content: center; overflow: hidden; z-index:-1;"
					>
						<Confetti
							x={[-5, 5]}
							y={[0, 0.1]}
							infinite
							duration={5000}
							amount={200}
							fallDistance="100vh"
						/>
					</div>
					<AccordionItem open>
						<svelte:fragment slot="lead"><div class="text-xl">🥇</div></svelte:fragment>
						<svelte:fragment slot="summary">Winners</svelte:fragment>
						<svelte:fragment slot="content">
							<ol class="text-md font-normal list">
								{#each winners as winner, index}
									<li>
										<div class="flex items-center gap-2">
											<Avatar
												src={winner.imageURL}
												width="w-8 sm:w-10 aspect-square"
												rounded="rounded-full"
											/>
											<div class="flex flex-col">
												<h6 class="font-bold">{winner.firstName}</h6>
												<small class="text-[10px] sm:text-sm">{winner.email}</small>
											</div>
										</div>
									</li>
								{/each}
							</ol>
						</svelte:fragment>
					</AccordionItem>
				{/if}
				<AccordionItem open>
					<svelte:fragment slot="lead"><Icon scale={1.5} data={infoCircle} /></svelte:fragment>
					<svelte:fragment slot="summary">Description</svelte:fragment>
					<svelte:fragment slot="content">
						<p class="text-md font-thin">
							{storylineData.description}
						</p>
					</svelte:fragment>
				</AccordionItem>
				{#if storylineData.tags && storylineData.tags.length > 0}
					<AccordionItem>
						<svelte:fragment slot="lead"><Icon scale={1.5} data={tag} /></svelte:fragment>
						<svelte:fragment slot="summary">Tags</svelte:fragment>
						<svelte:fragment slot="content">
							<div class="gap-2">
								{#each storylineData.tags as tag}
									<div class="chip variant-filled">{tag}</div>
								{/each}
							</div>
						</svelte:fragment>
					</AccordionItem>
				{/if}
				{#if bookData.campaign}
					<AccordionItem>
						<svelte:fragment slot="lead"><Icon scale={1.1} data={calendar} /></svelte:fragment>
						<svelte:fragment slot="summary">Dates</svelte:fragment>
						<svelte:fragment slot="content">
							<div class="flex flex-col md:flex-row justify-between gap-2">
								<div class="chip variant-filled">
									Start Date - {formattedDate(
										new Date(
											typeof bookData.campaign.startDate === 'string'
												? bookData.campaign.startDate
												: ''
										)
									)}
								</div>
								<div class="chip variant-filled">
									End Date - {formattedDate(
										new Date(
											typeof bookData.campaign.endDate === 'string' ? bookData.campaign.endDate : ''
										)
									)}
								</div>
							</div>
						</svelte:fragment>
					</AccordionItem>
					{#if bookData.campaign.criteria}
						<AccordionItem>
							<svelte:fragment slot="lead"><Icon scale={1.5} data={checkCircle} /></svelte:fragment>
							<svelte:fragment slot="summary">Criteria</svelte:fragment>
							<svelte:fragment slot="content">
								<ol class="text-md font-thin list">
									{#each bookData.campaign.criteria as criterion, index}
										<li>
											<span class="flex-auto">{criterion.value}</span>
										</li>
									{/each}
								</ol>
							</svelte:fragment>
						</AccordionItem>
					{/if}
					{#if bookData.campaign.rewards}
						<AccordionItem>
							<svelte:fragment slot="lead"><Icon scale={1.4} data={trophy} /></svelte:fragment>
							<svelte:fragment slot="summary">Rewards</svelte:fragment>
							<svelte:fragment slot="content">
								<ol class="text-md font-thin list">
									{#each bookData.campaign.rewards as reward, index}
										<li>
											<span class="flex-auto">{reward.value}</span>
										</li>
									{/each}
								</ol>
							</svelte:fragment>
						</AccordionItem>
					{/if}
					{#if bookData.campaign.resources}
						<AccordionItem>
							<svelte:fragment slot="lead"><Icon scale={1.5} data={gear} /></svelte:fragment>
							<svelte:fragment slot="summary">Resources</svelte:fragment>
							<svelte:fragment slot="content">
								<ol class="text-md font-normal list">
									{#each bookData.campaign.resources as resource, index}
										<li>
											{#if resource.link}
												<a
													target="_blank"
													href={resource.link}
													class="text-blue-600 dark:text-blue-500 hover:underline"
													>{resource.value}</a
												>
											{:else}
												<span class="flex-auto">{resource.value}</span>
											{/if}
										</li>
									{/each}
								</ol>
							</svelte:fragment>
						</AccordionItem>
					{/if}
				{/if}
			</Accordion>
			<hr class="opacity-50" />
		</div>
	</div>
</div>
