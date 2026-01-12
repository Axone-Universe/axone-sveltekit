<script lang="ts">
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { InputChip, type ToastSettings, getToastStore } from '@skeletonlabs/skeleton';
	import type { BookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { GENRES } from '$lib/properties/genre';
	import ImageUploader from '../util/ImageUploader.svelte';
	import { uploadImage } from '$lib/util/bucket/bucket';
	import { onMount } from 'svelte';
	import type { PermissionProperties } from '$lib/properties/permission';
	import type { CampaignProperties } from '$lib/properties/campaign';
	import type { Response } from '$lib/util/types';
	import CampaignFeaturesList from './CampaignFeaturesList.svelte';
	import { campaignDaysLeft } from '$lib/util/constants';
	import UserFilter from '../user/UserFilter.svelte';
	import { type UserProperties } from '$lib/properties/user';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { trash } from 'svelte-awesome/icons';

	export let book: HydratedDocument<BookProperties>;
	export let campaign: HydratedDocument<CampaignProperties>;
	export let supabase: SupabaseClient;
	export let cancelCallback: () => void = () => undefined;
	export let createCallback: (() => void) | undefined = undefined;
	export let disabled: false;

	let customClass = '';
	export { customClass as class };

	let imageFile: File;
	let genres = book.genres ?? [];
	let tags = book.tags ?? [];

	let tempStartDate = campaign.startDate ? (campaign.startDate as unknown as string) : '';
	let tempEndDate = campaign.endDate ? (campaign.endDate as unknown as string) : '';

	let resources = campaign.resources ?? [];
	let criteria = campaign.criteria ?? [];
	let rewards = campaign.rewards ?? [];
	let winners: HydratedDocument<UserProperties>[] = [];

	// Used for the users filter
	let users: { [key: string]: HydratedDocument<UserProperties> } = {};

	const toastStore = getToastStore();

	// Track updated fields - initialize with id if campaign has one
	let updatedData: any = campaign._id ? { id: campaign._id } : {};

	// Track previous campaign._id to only reset when it actually changes
	let previousCampaignId: string | undefined = campaign._id?.toString();

	// Reset updatedData only when campaign._id actually changes
	$: {
		const currentCampaignId = campaign._id?.toString();
		if (currentCampaignId && currentCampaignId !== previousCampaignId) {
			updatedData = { id: campaign._id };
			genres = book.genres ?? [];
			tags = book.tags ?? [];
			resources = campaign.resources ?? [];
			criteria = campaign.criteria ?? [];
			rewards = campaign.rewards ?? [];
			previousCampaignId = currentCampaignId;
		}
	}

	// Initialize on mount
	onMount(() => {
		// Ensure dates are Date objects before calling toLocaleDateString
		const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
		const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
		tempStartDate = startDate ? startDate.toLocaleDateString('fr-CA') : '';
		tempEndDate = endDate ? endDate.toLocaleDateString('fr-CA') : '';

		previousCampaignId = campaign._id?.toString();
		genres = book.genres ?? [];
		tags = book.tags ?? [];
		resources = campaign.resources ?? [];
		criteria = campaign.criteria ?? [];
		rewards = campaign.rewards ?? [];

		// pre-fill the permissions
		book.permissions.public = {
			_id: 'public',
			permission: 'collaborate'
		} as HydratedDocument<PermissionProperties>;

		// fetch winners
		fetchWinners();
	});

	// Handler functions that update both book/campaign and updatedData
	function handleTitleInput(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		book.title = value;
		if (!updatedData.book) updatedData.book = {};
		updatedData.book.title = value;
	}

	function handleDescriptionInput(event: Event) {
		const value = (event.target as HTMLTextAreaElement).value;
		book.description = value;
		if (!updatedData.book) updatedData.book = {};
		updatedData.book.description = value;
	}

	// Track imageURL changes (ImageUploader uses bind:imageURL, so we watch for changes)
	$: if (campaign._id && book.imageURL !== undefined) {
		if (!updatedData.book) updatedData.book = {};
		updatedData.book.imageURL = book.imageURL;
	}

	// Track genres changes
	function handleGenresChange(newGenres: string[]) {
		genres = newGenres as any;
		book.genres = newGenres as any;
		if (!updatedData.book) updatedData.book = {};
		updatedData.book.genres = newGenres;
	}

	// Track tags changes
	function handleTagsChange() {
		book.tags = tags;
		// Tags are not sent in the update, so we don't track them in updatedData
	}

	// Handle start date changes
	function handleStartDateInput(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		tempStartDate = value;
		campaign.startDate = new Date(value);
		updatedData.startDate = campaign.startDate;
	}

	// Handle end date changes
	function handleEndDateInput(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		tempEndDate = value;
		campaign.endDate = new Date(value);
		updatedData.endDate = campaign.endDate;
	}

	// Handle criteria changes from CampaignFeaturesList
	function handleCriteriaChange(event: CustomEvent<{ value: string; link: string }[]>) {
		updatedData.criteria = event.detail;
	}

	// Handle rewards changes from CampaignFeaturesList
	function handleRewardsChange(event: CustomEvent<{ value: string; link: string }[]>) {
		updatedData.rewards = event.detail;
	}

	// Handle resources changes from CampaignFeaturesList
	function handleResourcesChange(event: CustomEvent<{ value: string; link: string }[]>) {
		updatedData.resources = event.detail;
	}

	// Handle winners changes
	function handleWinnersChange() {
		updatedData.winners = winners.map((user) => user._id);
	}

	async function submit() {
		if (!imageFile) {
			createCampaignData();
			return;
		}

		const response = await uploadImage(supabase, `books/${book._id}`, imageFile, toastStore);

		if (response.url) {
			createCampaignData(response.url);
			return;
		}

		const t: ToastSettings = {
			message: 'Error uploading book cover',
			background: 'variant-filled-error'
		};
		toastStore.trigger(t);
	}

	/** Called when permission user is selected */
	function onUserSelect(event: any) {
		let userID = event.detail.value;

		if (winners.find((user) => user._id === userID)) return;

		winners.push(users[userID]);
		winners = winners;
		handleWinnersChange();
	}

	async function fetchWinners() {
		if (campaign.winners && campaign.winners.length > 0) {
			const users = (
				await trpc($page).users.getByIds.query({
					ids: campaign.winners as string[]
				})
			).data;

			if (users) {
				winners = users as HydratedDocument<UserProperties>[];
			}
		}
	}

	function deleteWinner(index: number) {
		winners.splice(index, 1);
		winners = winners;
		handleWinnersChange();
	}

	async function createCampaignData(imageURL?: string) {
		try {
			let response: Response = {
				message: '',
				success: false,
				data: undefined
			};

			if (book._id) {
				// Only send updatedData for updates (it already includes the id)
				const updatePayload: any = {
					...updatedData
				};

				// Include imageURL if it was uploaded
				if (imageURL) {
					if (!updatePayload.book) updatePayload.book = {};
					updatePayload.book.imageURL = imageURL;
				}

				// Include book id if not already set
				if (updatePayload.book && !updatePayload.book.id) {
					updatePayload.book.id = book._id;
				}

				// If no changes detected (only id in updatedData), show a message and return
				const hasChanges =
					Object.keys(updatedData).filter((key) => key !== 'id').length > 0 ||
					(updatedData.book && Object.keys(updatedData.book).length > 0);
				if (!hasChanges) {
					const t: ToastSettings = {
						message: 'No changes detected',
						background: 'variant-filled-primary'
					};
					toastStore.trigger(t);
					return;
				}

				response = await trpc($page).campaigns.update.mutate(updatePayload);
			} else {
				response = await trpc($page).campaigns.create.mutate({
					startDate: campaign.startDate!,
					origin: $page.url.origin,
					endDate: campaign.endDate!,
					criteria: criteria,
					rewards: rewards,
					resources: resources,
					book: {
						title: book.title,
						description: book.description,
						imageURL: imageURL ?? book.imageURL,
						genres,
						permissions: book.permissions
					}
				});
			}

			if (response.success) {
				// Reset updatedData after successful save (include id if campaign has one)
				if (response.data) {
					campaign = response.data as HydratedDocument<CampaignProperties>;
					updatedData = campaign._id ? { id: campaign._id } : {};
					// Sync local state
					genres = book.genres ?? [];
					tags = book.tags ?? [];
					resources = campaign.resources ?? [];
					criteria = campaign.criteria ?? [];
					rewards = campaign.rewards ?? [];
					// Ensure dates are Date objects before calling toLocaleDateString
					const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
					const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
					tempStartDate = startDate ? startDate.toLocaleDateString('fr-CA') : '';
					tempEndDate = endDate ? endDate.toLocaleDateString('fr-CA') : '';
				}
			}

			const t: ToastSettings = {
				message: response.success
					? 'Campaign updated successfully'
					: 'Campaign update unsuccessful. ' + response.message,
				background: response.success ? 'variant-filled-primary' : 'variant-filled-error'
			};
			toastStore.trigger(t);

			if (createCallback !== undefined) {
				createCallback();
			}
		} catch (e) {
			console.log(e);
		}
	}
</script>

<div class="{customClass} w-modal">
	<form on:submit|preventDefault={submit} class="card p-2 sm:p-4 space-y-4">
		<fieldset {disabled}>
			<div class="flex justify-between gap-2">
				<div class="flex flex-col w-full gap-2">
					<label for="campaign-title">* Campaign Title</label>
					<input
						id="title"
						class="input"
						type="text"
						value={book.title}
						on:input={handleTitleInput}
						placeholder="Untitled Campaign"
						required
					/>
					<label for="campaign-description">* Description</label>
					<textarea
						id="description"
						class="textarea w-full h-full overflow-hidden"
						value={book.description}
						on:input={handleDescriptionInput}
						required
					/>
				</div>
				<ImageUploader
					bind:imageURL={book.imageURL}
					bind:imageFile
					class="card w-5/6 md:w-1/3 aspect-[2/3] h-fit overflow-hidden relative"
				/>
			</div>
			<div class="flex flex-col gap-2">
				Genres
				<div id="genres-div" class="flex flex-wrap gap-1">
					{#each GENRES as genre}
						<button
							class="chip {genres.includes(genre) ? 'variant-filled' : 'variant-soft'}"
							type="button"
							on:click={() => {
								const index = genres.indexOf(genre);
								let newGenres;
								if (index > -1) {
									newGenres = genres.filter((v) => v !== genre);
								} else {
									newGenres = [...genres, genre];
								}
								handleGenresChange(newGenres);
							}}
						>
							<span class="capitalize">{genre}</span>
						</button>
					{/each}
				</div>
			</div>
			<div id="tags-div" class="flex flex-col gap-2">
				Tags
				<InputChip bind:value={tags} name="tags" placeholder="Enter any value..." />
			</div>
			<div id="dates-div" class="flex flex-col sm:flex-row w-full gap-2">
				<div class="grow flex flex-col gap-2">
					* Start date
					<input
						id="start-date-input"
						class="input"
						type="date"
						max={tempEndDate}
						value={tempStartDate}
						on:input={handleStartDateInput}
					/>
				</div>
				<div class="grow flex flex-col gap-2">
					* End date
					<input
						id="end-date-input"
						class="input"
						type="date"
						min={tempStartDate}
						value={tempEndDate}
						on:input={handleEndDateInput}
					/>
				</div>
			</div>
			<div id="criteria-div" class="flex flex-col gap-2">
				Submission Criteria
				<CampaignFeaturesList
					bind:features={criteria}
					placeholder="e.g. All entries must be original work"
					class="textarea w-full h-full overflow-hidden"
					on:featuresChange={handleCriteriaChange}
				/>
			</div>
			<div id="rewards-div" class="flex flex-col gap-2">
				Rewards
				<CampaignFeaturesList
					bind:features={rewards}
					placeholder="e.g. Publishing deal with Penguin!"
					class="textarea w-full h-full overflow-hidden"
					on:featuresChange={handleRewardsChange}
				/>
			</div>
			<div id="resources-div" class="flex flex-col gap-2">
				Resources
				<CampaignFeaturesList
					bind:features={resources}
					insertLink={true}
					placeholder="e.g. Judging Criteria"
					class="textarea w-full h-full overflow-hidden"
					on:featuresChange={handleResourcesChange}
				/>
			</div>
			{#if book._id && campaignDaysLeft(campaign)[0] < 0}
				<div id="resources-div" class="flex flex-col gap-2">
					Winners
					<div class="card p-2 w-full shadow-sm space-y-2">
						<UserFilter bind:users {onUserSelect} />
						{#each winners as user, index}
							<div class="flex justify-between items-center">
								<div class="flex items-center gap-2">
									<div class="flex space-x-4">
										<button
											class="btn-icon variant-filled-primary"
											on:click|stopPropagation={() => deleteWinner(index)}
											type="button"
										>
											<Icon data={trash} scale={1.2} />
										</button>
									</div>
									<div class="flex flex-col">
										<h6 class="font-bold">{user.firstName}</h6>
										<small class="text-[10px] sm:text-sm">{user.email}</small>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			{#if !disabled}
				<div class="flex flex-col justify-end sm:flex-row gap-2 mt-4">
					<button class="btn variant-ghost-surface" on:click={cancelCallback} type="button"
						>Cancel</button
					>
					<button class="btn variant-filled" type="submit">
						{book._id ? 'Update' : 'Create'}
					</button>
				</div>
			{/if}
		</fieldset>
	</form>
</div>
