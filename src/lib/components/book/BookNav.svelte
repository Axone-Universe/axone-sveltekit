<script lang="ts">
	import type { BookProperties } from '$lib/properties/book';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import { Accordion, AccordionItem, ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import Icon from 'svelte-awesome';
	import { lock, eyeSlash, archive } from 'svelte-awesome/icons';

	import { createEventDispatcher } from 'svelte';

	export let storylines: HydratedDocument<StorylineProperties>[];
	export let chapters = storylines[0].chapters!;
	export let selectedChapter = '';
	export let selectedStoryline = '';

	let customClass = '';
	export { customClass as class };

	let dispatch = createEventDispatcher();

	const navItemClicked = (id: string) => {
		dispatch('navItemClicked', id);
	};
</script>

<div class={`${customClass}`}>
	<Accordion>
		<AccordionItem open>
			<svelte:fragment slot="summary">
				<p class="text-lg font-bold">Storylines</p>
			</svelte:fragment>
			<svelte:fragment slot="content">
				<ListBox>
					{#each Object.entries(storylines) as [id, storyline]}
						<ListBoxItem
							on:change={() => navItemClicked(storyline._id)}
							bind:group={selectedStoryline}
							name="storyline"
							class="soft-listbox"
							value={storyline._id}
						>
							<div class="line-clamp-1 flex justify-between items-center">
								<p class="w-5/6 line-clamp-1">
									{storyline.title ? storyline.title : 'New Storyline'}
								</p>
								<div class="line-clamp-1 flex justify-end space-x-2 items-center">
									{#if !storyline.userPermissions?.view}
										<Icon data={eyeSlash} scale={1.2} />
									{/if}
									{#if storyline.archived}
										<Icon data={archive} scale={1} />
									{:else if !storyline.userPermissions?.collaborate}
										<Icon data={lock} scale={1.2} />
									{/if}
								</div>
							</div>
						</ListBoxItem>
					{/each}
				</ListBox>
			</svelte:fragment>
		</AccordionItem>
		<AccordionItem open>
			<svelte:fragment slot="summary">
				<p class="text-lg font-bold">Chapters</p>
			</svelte:fragment>
			<svelte:fragment slot="content">
				<ListBox>
					{#each Object.entries(chapters) as [id, chapter]}
						<ListBoxItem
							on:change={() => navItemClicked(chapter._id)}
							bind:group={selectedChapter}
							name="chapter"
							class="soft-listbox"
							value={chapter._id}
						>
							<div class="line-clamp-1 flex justify-between items-center">
								<p class="line-clamp-1">{chapter.title}</p>
								<div class="line-clamp-1 flex justify-end space-x-2 items-center">
									{#if !chapter.userPermissions?.view}
										<Icon data={eyeSlash} scale={1.2} />
									{/if}
									{#if chapter.archived}
										<Icon data={archive} scale={1} />
									{:else if !chapter.userPermissions?.collaborate}
										<Icon data={lock} scale={1.2} />
									{/if}
								</div>
							</div>
						</ListBoxItem>
					{/each}
				</ListBox>
			</svelte:fragment>
		</AccordionItem>
		<!-- ... -->
	</Accordion>
</div>
