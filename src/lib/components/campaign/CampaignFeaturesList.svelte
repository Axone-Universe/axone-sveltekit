<script lang="ts">
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import { plus, trash } from 'svelte-awesome/icons';
	import Icon from 'svelte-awesome/components/Icon.svelte';

	export let features: { value: string; link: string }[];
	export let placeholder: string;
	export let insertLink: boolean = false;

	let customClass = '';
	export { customClass as class };

	let featuresList = '';
	let feature = '';
	let link = '';

	async function createFeature() {
		if (feature) {
			features.push({ value: feature, link: link });
			features = features;
		}
	}

	async function deleteNote(index: number) {
		console.log('deleting note ' + index);
		features.splice(index, 1);
		features = features;
	}
</script>

<div class={`card p-2 w-full shadow-sm space-y-2 ${customClass}`}>
	<div class="p-2">
		<div class="flex input p-1 my-2 gap-2 justify-between">
			<button
				id="plus-btn"
				class="btn-icon variant-filled-primary shrink-0"
				on:click={createFeature}
				type="button"
			>
				<Icon class="p-2" data={plus} scale={2.3} />
			</button>
			<input
				class="input border-0 hover:bg-transparent focus:bg-transparent {insertLink
					? 'border-r rounded-none'
					: ''}"
				type="text"
				{placeholder}
				bind:value={feature}
			/>
			{#if insertLink}
				<input
					class="input border-0 hover:bg-transparent focus:bg-transparent w-2/6"
					type="url"
					placeholder="Paste a link"
					bind:value={link}
				/>
			{/if}
		</div>
		<div class="max-h-48 overflow-y-auto">
			<ListBox class="space-y-2">
				{#each features as feature, index}
					<ListBoxItem
						bind:group={featuresList}
						name="chapter"
						class="soft-listbox !p-1"
						value={index}
					>
						<div class="flex justify-start gap-2 items-center">
							<div class="flex space-x-4">
								<button
									class="btn-icon variant-filled-primary"
									on:click|stopPropagation={() => deleteNote(index)}
									type="button"
								>
									<Icon data={trash} scale={1.2} />
								</button>
							</div>
							{#if feature.link}
								<a
									target="_blank"
									href={feature.link}
									class="text-blue-600 dark:text-blue-500 hover:underline">{feature.value}</a
								>
							{:else}
								<p class="line-clamp-1">{feature.value}</p>
							{/if}
						</div>
					</ListBoxItem>
				{/each}
			</ListBox>
		</div>
	</div>
</div>
