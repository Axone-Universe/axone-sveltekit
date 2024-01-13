<script lang="ts">
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { InputChip, type ToastSettings, getToastStore } from '@skeletonlabs/skeleton';
	import type { BookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { GENRES } from '$lib/properties/genre';
	import ImageUploader from '../util/ImageUploader.svelte';
	import { uploadBookCover } from '$lib/util/bucket/bucket';
	import { onMount } from 'svelte';
	import type { PermissionProperties } from '$lib/properties/permission';
	import type { CampaignProperties } from '$lib/properties/campaign';
	import { format } from 'date-fns';

	export let book: HydratedDocument<BookProperties>;
	export let campaign: HydratedDocument<CampaignProperties>;
	export let supabase: SupabaseClient;
	export let cancelCallback: () => void = () => undefined;
	export let createCallback: (() => void) | undefined = undefined;
	let customClass = '';
	export { customClass as class };

	let imageFile: File;
	let genres = book.genres ?? [];
	$: tags = book.tags ?? [];
	// TODO: Dates are bugged - find a fix!
	let tempStartDate = campaign.startDate ? format(new Date(campaign.startDate), 'yyyy-mm-dd') : '';
	let tempEndDate = campaign.endDate ? format(new Date(campaign.endDate), 'yyyy-mm-dd') : '';

	$: campaign.startDate = new Date(tempStartDate);
	$: campaign.endDate = new Date(tempEndDate);

	const toastStore = getToastStore();

	onMount(() => {
		// pre-fill the permissions
		book.permissions.public = {
			_id: 'public',
			permission: 'collaborate'
		} as HydratedDocument<PermissionProperties>;
	});

	async function createCampaign() {
		if (!imageFile) {
			createCampaignData();
			return;
		}

		const url = await uploadBookCover(supabase, imageFile);

		if (url) {
			createCampaignData(url);
			return;
		}

		const t: ToastSettings = {
			message: 'Error uploading book cover',
			background: 'variant-filled-error'
		};
		toastStore.trigger(t);
	}

	async function createCampaignData(imageURL?: string) {
		try {
			if (book._id) {
				await trpc($page).campaigns.update.mutate({
					id: campaign.id,
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
				await trpc($page).campaigns.create.mutate({
					startDate: campaign.startDate!,
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

				const t: ToastSettings = {
					message: 'Campaign created successfully',
					background: 'variant-filled-primary'
				};
				toastStore.trigger(t);
			}

			if (createCallback !== undefined) {
				createCallback();
			}
		} catch (e) {
			console.log(e);
		}
	}
</script>

<div class="{customClass} w-modal">
	<div class="card p-2 sm:p-4 space-y-4">
		<div class="flex justify-between gap-2">
			<div class="flex flex-col w-full gap-2">
				<label for="campaign-title">* Campaign Title</label>
				<input
					id="campaign-title"
					class="input"
					type="text"
					bind:value={book.title}
					placeholder="Untitled Campaign"
					required
				/>
				<label for="campaign-description">* Description</label>
				<textarea
					id="campaign-description"
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
			<div class="flex flex-wrap gap-1">
				{#each GENRES as genre}
					<button
						class="chip {genres.includes(genre) ? 'variant-filled' : 'variant-soft'}"
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
		<div class="flex flex-col gap-2">
			Tags
			<InputChip bind:value={tags} name="tags" placeholder="Enter any value..." />
		</div>
		<div class="flex flex-col sm:flex-row w-full gap-2">
			<div class="grow flex flex-col gap-2">
				* Start date
				<input class="input" type="date" max={tempEndDate} bind:value={tempStartDate} />
			</div>
			<div class="grow flex flex-col gap-2">
				* End date
				<input class="input" type="date" min={tempStartDate} bind:value={tempEndDate} />
			</div>
		</div>
		<div class="flex flex-col gap-2">
			* Submission Criteria
			<textarea
				class="textarea w-full h-full overflow-hidden"
				bind:value={campaign.submissionCriteria}
				required
			/>
		</div>
		<div class="flex flex-col gap-2">
			* Rewards
			<textarea
				class="textarea w-full h-full overflow-hidden"
				bind:value={campaign.rewards}
				required
			/>
		</div>
		<div class="flex flex-col justify-end sm:flex-row gap-2">
			<button class="btn variant-ghost-surface" on:click={cancelCallback}>Cancel</button>
			<button class="btn variant-filled" type="submit" on:click={createCampaign}>
				{book._id ? 'Update' : 'Create'}
			</button>
		</div>
	</div>
</div>
