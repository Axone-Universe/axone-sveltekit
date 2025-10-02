<script lang="ts">
	import type { HydratedDocument } from 'mongoose';
	import type { BookProperties } from '$lib/properties/book';
	import BookPreview from '../book/BookPreview.svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import { check } from 'svelte-awesome/icons';

	export let campaignBooks: HydratedDocument<BookProperties>[] = [];
	export let selectedCampaignBookIds: string[] = [];
	export let onSelect: (book: HydratedDocument<BookProperties>, selected: boolean) => void;

	const modalStore = getModalStore();

	function toggleCampaign(book: HydratedDocument<BookProperties>) {
		const isSelected = selectedCampaignBookIds.includes(book._id);
		onSelect(book, !isSelected);

		// Update selected IDs
		if (isSelected) {
			selectedCampaignBookIds = selectedCampaignBookIds.filter((id) => id !== book._id);
		} else {
			selectedCampaignBookIds = [...selectedCampaignBookIds, book._id];
		}
	}
</script>

<div class="card p-4 w-full max-w-4xl max-h-[80vh] overflow-auto">
	<header class="mb-4">
		<h2 class="h2">Select Campaign</h2>
		<p class="text-surface-600-300-token">Choose a campaign to add this storyline to</p>
	</header>

	{#if campaignBooks.length === 0}
		<div class="text-center py-8">
			<p class="text-surface-500">No active campaigns found</p>
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			{#each campaignBooks as campaignBook (campaignBook._id)}
				<button type="button" class="relative" on:click={() => toggleCampaign(campaignBook)}>
					<div
						class={selectedCampaignBookIds.includes(campaignBook._id)
							? 'ring-4 ring-primary-500 rounded-md'
							: ''}
					>
						<BookPreview book={campaignBook} />
					</div>
					{#if selectedCampaignBookIds.includes(campaignBook._id)}
						<div
							class="absolute top-2 right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center"
						>
							<Icon class="text-white" data={check} scale={1} />
						</div>
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	<footer class="mt-6 flex justify-end gap-2">
		<button class="btn variant-ghost-surface" on:click={() => modalStore.close()}> Cancel </button>
	</footer>
</div>
