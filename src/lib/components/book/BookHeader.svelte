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
		book
	} from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { afterUpdate, createEventDispatcher, onMount } from 'svelte';
	import type { StorylineProperties } from '$lib/properties/storyline';
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
		Toast,
		getToastStore,
		type ToastSettings
	} from '@skeletonlabs/skeleton';
	import type { Genre } from '$lib/properties/genre';
	import Tooltip from '$lib/components/Tooltip.svelte';

	import { page } from '$app/stores';
	import type { UserProperties } from '$lib/properties/user';
	import { trpc } from '$lib/trpc/client';
	import type { Session } from '@supabase/supabase-js';
	import DocumentCarousel from '../documents/DocumentCarousel.svelte';
	import type { CampaignProperties } from '$lib/properties/campaign';
	import { formattedDate } from '$lib/util/studio/strings';
	import { documentURL } from '$lib/util/links';
	import ShareSocialModal from '$lib/components/documents/ShareSocialModal.svelte';

	let customClass = '';

	export { customClass as class };
	export let bookData: HydratedDocument<HydratedBookProperties>;
	export let storylines: { [key: string]: HydratedDocument<StorylineProperties> } = {};
	export let session: Session | null;
	export let storylineData: HydratedDocument<StorylineProperties>;

	let bookGenres: Genre[] | undefined;
	let user: HydratedDocument<UserProperties> | undefined = undefined;

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

	function campaignDaysLeft(): [number, string] {
		if (!bookData.campaign) {
			return [0, ''];
		}

		// One day in milliseconds
		const oneDay = 1000 * 60 * 60 * 24;

		const campaignEndDate = new Date(
			(bookData.campaign as HydratedDocument<CampaignProperties>).endDate as unknown as string
		);

		// Calculating the time difference between two dates
		const diffInTime = campaignEndDate.getTime() - new Date().getTime();

		// Calculating the no. of days between two dates
		const diffInDays = Math.round(diffInTime / oneDay);

		let color = 'variant-filled-success';
		if (diffInDays >= 0 && diffInDays <= 2) {
			color = 'variant-filled-warning';
		} else if (diffInDays < 0) {
			color = 'variant-filled-error';
		}

		return [diffInDays, color];
	}

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
		class="bg-gradient-to-b {$modeCurrent ? 'from-white/70' : 'from-black/70'} from-10%
        [.dark_&]:via-[rgba(var(--color-surface-900))] via-[rgba(var(--color-surface-50))] via-70%
        [.dark_&]:to-[rgba(var(--color-surface-900))] to-[rgba(var(--color-surface-50))]
        w-full space-x-4 h-full"
	>
		<div class="px-4 md:px-10 pt-60 overflow-hidden space-y-4 relative">
			{#if bookData.campaign}
				<div
					class="absolute top-4 right-4 flex h-fit items-center bg-orange-700 py-1 px-2 rounded-full"
				>
					<p class="text-sm md:text-md font-bold text-white">campaign</p>
				</div>
			{/if}
			<div class="p-2 space-y-4">
				<div class="flex flex-col items-center p-2">
					<p class="book-title text-4xl font-bold relative">
						{storylineData.title}
						<button
							use:popup={infoPopup}
							class="badge-icon z-10 variant-filled absolute -top-3 -right-5"
							><Icon class="top-0 cursor-pointer icon-info" data={infoCircle} scale={1.5} />
						</button>
					</p>
				</div>
				<div class="flex flex-col p-2 space-x-4 w-full items-center">
					<div class="flex flex-row !justify-start items-center w-3/5 gap-4">
						{#if Object.values(storylines).length > 1}
							<div class="relative">
								<h3 class="book-title">
									{bookData.campaign ? 'Campaign Titled: ' : 'Book Titled: '}
									{bookData.title}
								</h3>
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
						/>
					{/if}
				</div>

				<div class="flex flex-row items-center space-x-2">
					<a
						href="/editor/{bookData._id}?mode=reader&storylineID={selectedStoryline._id}"
						class="btn variant-filled py-1"
					>
						<Icon class="p-2" data={leanpub} scale={2.5} />
						Read
					</a>

					{#if !storylineData._id || (bookData.userPermissions?.collaborate && bookData.campaign)}
						<Tooltip
							on:click={() => {
								if (campaignDaysLeft()[0] >= 0)
									window.open(`/storyline/create?bookID=${bookData._id}`, '_blank');
							}}
							content="Join the campaign by creating a new storyline!"
							placement="top"
							target="create-storyline"
						>
							<button
								class="btn-icon {bookData.campaign ? 'bg-orange-700' : 'variant-filled-primary'}"
								disabled={campaignDaysLeft()[0] < 0}
							>
								<Icon class="top-0 cursor-pointer !fill-white" data={plus} scale={1.5} />
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
							<button class="btn-icon variant-filled">
								<Icon class="p-2" data={pencil} scale={2.5} />
							</button>
						</Tooltip>
					{/if}
					<Tooltip on:click={copyLink} content="Share" placement="top" target="copy-link">
						<button id="copy-link" class="btn-icon variant-filled-primary">
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
							<div class="flex h-fit items-center {campaignDaysLeft()[1]} py-1 px-2 rounded-full">
								<p class="flex items-center !py-0 text-sm md:text-md font-bold text-white">
									{#if campaignDaysLeft()[0] > 0}
										<Icon class="p-2  !hidden md:!block" data={calendar} scale={2} />
										{campaignDaysLeft()[0]} days left
									{:else}
										<Icon class="p-2 !hidden md:!block" data={warning} scale={2} />
										closed
									{/if}
								</p>
							</div>
						</div>
					{/if}
				</div>
				<div class="space-x-2 line-clamp-1">
					{#if bookGenres}
						{#each bookGenres as genre}
							<div class="chip variant-filled">{genre}</div>
						{/each}
					{/if}
				</div>
			</div>
			<hr class="opacity-50" />
			<Accordion>
				<AccordionItem open>
					<svelte:fragment slot="lead"><Icon scale={1.5} data={infoCircle} /></svelte:fragment>
					<svelte:fragment slot="summary">Description</svelte:fragment>
					<svelte:fragment slot="content">
						<p class="text-lg font-thin">
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
						<svelte:fragment slot="summary">
							{formattedDate(
								new Date(
									typeof bookData.campaign.endDate === 'string' ? bookData.campaign.endDate : ''
								)
							)}
						</svelte:fragment>
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
					<AccordionItem>
						<svelte:fragment slot="lead"><Icon scale={1.5} data={checkCircle} /></svelte:fragment>
						<svelte:fragment slot="summary">Criteria</svelte:fragment>
						<svelte:fragment slot="content">
							<pre class="text-lg w-72 md:w-full font-thin overflow-scroll">
								{bookData.campaign.submissionCriteria}
							</pre>
						</svelte:fragment>
					</AccordionItem>
					<AccordionItem>
						<svelte:fragment slot="lead"><Icon scale={1.4} data={trophy} /></svelte:fragment>
						<svelte:fragment slot="summary">Rewards</svelte:fragment>
						<svelte:fragment slot="content">
							<pre class="text-lg w-72 md:w-full font-thin overflow-scroll">
								{bookData.campaign.rewards}
							</pre>
						</svelte:fragment>
					</AccordionItem>
				{/if}
			</Accordion>
			<hr class="opacity-50" />
		</div>
	</div>
</div>
