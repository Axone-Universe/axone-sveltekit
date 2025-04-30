<script lang="ts">
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { type ToastSettings, TagsInput } from '@skeletonlabs/skeleton-svelte';
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
	import { toaster } from '$lib/util/toaster/toaster-svelte';

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
	});

	async function submit() {
		if (!imageFile) {
			createCampaignData();
			return;
		}

		const response = await uploadImage(supabase, `books/${book._id}`, imageFile);

		if (response.url) {
			createCampaignData(response.url);
			return;
		}

		toaster.error({
			title: 'Error uploading book cover'
		});
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
					submissionCriteria: campaign.submissionCriteria!,
					rewards: campaign.rewards!,
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
					submissionCriteria: campaign.submissionCriteria!,
					rewards: campaign.rewards!,
					book: {
						title: book.title,
						description: book.description,
						imageURL: imageURL ?? book.imageURL,
						genres,
						permissions: book.permissions
					}
				});
			}

			toaster.info({
				title: response.success
					? 'Campaign updated successfully'
					: 'Campaign update unsuccessful. ' + response.message,
				type: response.success ? 'success' : 'error'
			});

			if (createCallback !== undefined) {
				createCallback();
			}
		} catch (e) {
			console.log(e);
		}
	}
</script>

<div class="{customClass} w-modal">
	<form on:submit|preventDefault="{submit}" class="card p-2 sm:p-4 space-y-4">
		<fieldset disabled="{disabled}">
			<div class="flex justify-between gap-2">
				<div class="flex flex-col w-full gap-2">
					<label for="campaign-title">* Campaign Title</label>
					<input
						id="title"
						class="input"
						type="text"
						bind:value="{book.title}"
						placeholder="Untitled Campaign"
						required
					/>
					<label for="campaign-description">* Description</label>
					<textarea
						id="description"
						class="textarea w-full h-full overflow-hidden"
						bind:value="{book.description}"
						required></textarea>
				</div>
				<ImageUploader
					bind:imageURL="{book.imageURL}"
					bind:imageFile="{imageFile}"
					class="card w-5/6 md:w-1/3 aspect-2/3 h-fit overflow-hidden relative"
				/>
			</div>
			<div class="flex flex-col gap-2">
				Genres
				<div id="genres-div" class="flex flex-wrap gap-1">
					{#each GENRES as genre}
						<button
							class="chip {genres.includes(genre) ? 'preset-filled' : 'preset-tonal'}"
							type="button"
							onclick="{() => {
								const index = genres.indexOf(genre);
								if (index > -1) {
									genres = genres.filter((v) => v !== genre);
								} else {
									genres = [...genres, genre];
								}
							}}"
						>
							<span class="capitalize">{genre}</span>
						</button>
					{/each}
				</div>
			</div>
			<div id="tags-div" class="flex flex-col gap-2">
				Tags
				<TagsInput bind:value="{tags}" name="tags" placeholder="Enter any value..." />
			</div>
			<div id="dates-div" class="flex flex-col sm:flex-row w-full gap-2">
				<div class="grow flex flex-col gap-2">
					* Start date
					<input
						id="start-date-input"
						class="input"
						type="date"
						max="{tempEndDate}"
						bind:value="{tempStartDate}"
					/>
				</div>
				<div class="grow flex flex-col gap-2">
					* End date
					<input
						id="end-date-input"
						class="input"
						type="date"
						min="{tempStartDate}"
						bind:value="{tempEndDate}"
					/>
				</div>
			</div>
			<div id="criteria-div" class="flex flex-col gap-2">
				* Submission Criteria
				<textarea
					id="criteria-textarea"
					class="textarea w-full h-full overflow-hidden"
					bind:value="{campaign.submissionCriteria}"
					required></textarea>
			</div>
			<div id="rewards-div" class="flex flex-col gap-2">
				* Rewards
				<textarea
					id="rewards-textarea"
					class="textarea w-full h-full overflow-hidden"
					bind:value="{campaign.rewards}"
					required></textarea>
			</div>
			{#if !disabled}
				<div class="flex flex-col justify-end sm:flex-row gap-2 mt-4">
					<button
						class="btn preset-tonal-surface border border-surface-500"
						onclick="{cancelCallback}"
						type="button">Cancel</button
					>
					<button class="btn preset-filled" type="submit">
						{book._id ? 'Update' : 'Create'}
					</button>
				</div>
			{/if}
		</fieldset>
	</form>
</div>
