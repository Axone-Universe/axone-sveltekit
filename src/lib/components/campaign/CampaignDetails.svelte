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
	import {
		type TopicNotificationProperties,
		type UserNotificationProperties
	} from '$lib/properties/notification';
	import { documentURL } from '$lib/util/links';
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
	$: tags = book.tags ?? [];

	let tempStartDate = campaign.startDate ? (campaign.startDate as unknown as string) : '';
	let tempEndDate = campaign.endDate ? (campaign.endDate as unknown as string) : '';

	let resources = campaign.resources ?? [];
	let criteria = campaign.criteria ?? [];
	let rewards = campaign.rewards ?? [];
	let winners: HydratedDocument<UserProperties>[] = [];

	// Used for the users filter
	let users: { [key: string]: HydratedDocument<UserProperties> } = {};
	// Used to send notifications to winners
	let notifications: { [key: string]: UserNotificationProperties | TopicNotificationProperties } =
		{};

	$: campaign.startDate = new Date(tempStartDate);
	$: campaign.endDate = new Date(tempEndDate);

	const toastStore = getToastStore();

	onMount(() => {
		tempStartDate = campaign.startDate ? campaign.startDate.toLocaleDateString('fr-CA') : '';
		tempEndDate = campaign.endDate ? campaign.endDate.toLocaleDateString('fr-CA') : '';

		// pre-fill the permissions
		book.permissions.public = {
			_id: 'public',
			permission: 'collaborate'
		} as HydratedDocument<PermissionProperties>;

		// fetch winners
		fetchWinners();
	});

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

		// create the notification to send to the winner
		notifications[userID] = {
			type: 'USER',
			senderID: campaign.user,
			receiverID: userID,
			subject: 'You have won!!',
			url: documentURL($page.url.origin, 'Book', book),
			notification: `🎉🎉 Congratulations!

			You are one of the winners for the campaign '${book.title}'.
			
			Please reach out to us at admin@axone.network to claim your prize 🏆`
		};

		// create the general notification to send to all users
		notifications['general'] = {
			url: documentURL($page.url.origin, 'Book', book),
			type: 'TOPIC',
			topicKey: 'general',
			topicName: 'general',
			subject: 'Writing Competition Winners!',
			notification: `We have released the winners of our campaign, '${book.title}'. 

			Find out more by visiting the campaign's page below. 

			Keep writing folks, more campaigns coming soon!!`
		};
	}

	function newCampaignNotification() {
		notifications['general'] = {
			url: documentURL($page.url.origin, 'Book', book),
			type: 'TOPIC',
			topicKey: 'general',
			topicName: 'general',
			subject: 'Writing Competition!',
			notification: `A new campaign, ${book.title}, has been launched. Hurry and submit to win your share of the rewards!`
		};

		return notifications;
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
	}

	async function createCampaignData(imageURL?: string) {
		try {
			let response: Response = {
				message: '',
				success: false,
				data: undefined
			};

			if (book._id) {
				response = await trpc($page).campaigns.update.mutate({
					id: campaign._id,
					startDate: campaign.startDate!,
					endDate: campaign.endDate!,
					criteria: criteria,
					rewards: rewards,
					resources: resources,
					winners: winners.map((user) => user._id),
					notifications,
					book: {
						id: book._id,
						title: book.title,
						description: book.description,
						imageURL: imageURL ?? book.imageURL,
						genres,
						permissions: book.permissions
					}
				});
			} else {
				response = await trpc($page).campaigns.create.mutate({
					startDate: campaign.startDate!,
					origin: $page.url.origin,
					endDate: campaign.endDate!,
					criteria: criteria,
					rewards: rewards,
					resources: resources,
					notifications: newCampaignNotification(),
					book: {
						title: book.title,
						description: book.description,
						imageURL: imageURL ?? book.imageURL,
						genres,
						permissions: book.permissions
					}
				});
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
						bind:value={book.title}
						placeholder="Untitled Campaign"
						required
					/>
					<label for="campaign-description">* Description</label>
					<textarea
						id="description"
						class="textarea w-full h-full overflow-hidden"
						bind:value={book.description}
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
								if (index > -1) {
									genres = genres.filter((v) => v !== genre);
								} else {
									genres = [...genres, genre];
								}
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
						bind:value={tempStartDate}
					/>
				</div>
				<div class="grow flex flex-col gap-2">
					* End date
					<input
						id="end-date-input"
						class="input"
						type="date"
						min={tempStartDate}
						bind:value={tempEndDate}
					/>
				</div>
			</div>
			<div id="criteria-div" class="flex flex-col gap-2">
				Submission Criteria
				<CampaignFeaturesList
					bind:features={criteria}
					placeholder="e.g. All entries must be original work"
					class="textarea w-full h-full overflow-hidden"
				/>
			</div>
			<div id="rewards-div" class="flex flex-col gap-2">
				Rewards
				<CampaignFeaturesList
					bind:features={rewards}
					placeholder="e.g. Publishing deal with Penguin!"
					class="textarea w-full h-full overflow-hidden"
				/>
			</div>
			<div id="resources-div" class="flex flex-col gap-2">
				Resources
				<CampaignFeaturesList
					bind:features={resources}
					insertLink={true}
					placeholder="e.g. Judging Criteria"
					class="textarea w-full h-full overflow-hidden"
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
