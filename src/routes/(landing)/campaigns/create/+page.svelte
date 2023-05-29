<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import { InputChip, type ToastSettings, toastStore } from '@skeletonlabs/skeleton';
	import { format } from 'date-fns';
	import { Icon } from 'svelte-awesome';
	import { close as closeIcon } from 'svelte-awesome/icons';

	let currentStartDate: string;
	let currentEndDate: string;
	let currentDateEvent: string;
	let organizerName: string;
	let organizerLink: string;

	let title = '';
	let dates: { startDate: Date; endDate: Date; event: string }[] = [];
	let about = '';
	let tags: string[] = [];
	let id = '';
	let bannerURL = '';

	function addDate() {
		if (currentStartDate && currentEndDate && currentDateEvent) {
			dates = [
				...dates,
				{
					startDate: new Date(currentStartDate),
					endDate: new Date(currentEndDate),
					event: currentDateEvent
				}
			];
			currentStartDate = '';
			currentEndDate = '';
			currentDateEvent = '';
		}
	}

	function removeDate(i: number) {
		const temp = dates;
		temp.splice(i, 1);
		dates = temp;
	}

	async function createCampaign() {
		await trpc($page).campaigns.create.mutate({
			id,
			title,
			dates,
			about,
			tags,
			organizer: {
				name: organizerName,
				link: organizerLink
			},
			bannerURL
		});

		const t: ToastSettings = {
			message: 'Campaign created successfully',
			background: 'variant-filled-primary'
		};
		toastStore.trigger(t);

		await goto("/campaigns")
	}
</script>

<Container>
	<div class="card p-4 space-y-4">
		<label>
			Campaign title
			<input class="input" type="text" bind:value={title} />
		</label>
		<div class="flex gap-2">
			<label>
				Organizer name
				<input class="input" type="text" bind:value={organizerName} />
			</label>
			<label>
				Organizer link
				<input class="input" type="text" bind:value={organizerLink} />
			</label>
		</div>
		<div class="flex gap-4 items-end">
			<div>
				Start date
				<input
					class="input"
					type="date"
					id="startDate"
					name="startDate"
					bind:value={currentStartDate}
				/>
			</div>
			<div>
				End date
				<input class="input" type="date" id="endDate" name="endDate" bind:value={currentEndDate} />
			</div>
			<label>
				Event name
				<input class="input" type="text" bind:value={currentDateEvent} />
			</label>
			<button class="btn variant-filled-primary h-fit" on:click={addDate}>Add dates</button>
		</div>
		<div class="flex gap-2">
			{#each dates as date, i}
				<button class="chip variant-filled flex items-center gap-1" on:click={() => removeDate(i)}>
					<p>
						{`${date.event}: ${format(new Date(date.startDate), 'd MMM y')} - ${format(
							new Date(date.endDate),
							'd MMM y'
						)}`}
					</p>
					<Icon data={closeIcon} />
				</button>
			{/each}
		</div>
		<label>
			About
			<input class="input" type="text" bind:value={about} />
		</label>
		<label>
			Banner Image URL
			<input class="input" type="text" bind:value={bannerURL} />
		</label>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			Tags
			<InputChip bind:value={tags} name="tags" placeholder="Enter any value..." />
		</label>
		<button class="btn variant-filled-primary" on:click={createCampaign}>Create Campaign</button>
	</div>
</Container>
