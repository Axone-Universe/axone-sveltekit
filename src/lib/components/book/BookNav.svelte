<script lang="ts">
	import type { BookProperties } from '$lib/properties/book';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import { Accordion, AccordionItem, ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import type { HydratedDocument } from 'mongoose';
	import { Icon } from 'svelte-awesome';
	import { lock } from 'svelte-awesome/icons';

	import { createEventDispatcher } from 'svelte';

	export let book: HydratedDocument<BookProperties>;
	export let storyline: HydratedDocument<StorylineProperties>;
	export let chapters = storyline.chapters!;
	export let selectedItem = '';

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
				<p class="text-lg font-bold">Book</p>
			</svelte:fragment>
			<svelte:fragment slot="content">
				<ListBox>
					<ListBoxItem
						on:change={() => navItemClicked(book._id)}
						bind:group={selectedItem}
						name="medium"
						class="soft-listbox"
						value="book"
					>
						<p class="line-clamp-1">{book.title}</p>
					</ListBoxItem>
				</ListBox>
			</svelte:fragment>
		</AccordionItem>
		<AccordionItem open>
			<svelte:fragment slot="summary">
				<p class="text-lg font-bold">Storyline</p>
			</svelte:fragment>
			<svelte:fragment slot="content">
				<ListBox>
					<ListBoxItem
						on:change={() => navItemClicked(storyline._id)}
						bind:group={selectedItem}
						name="medium"
						class="soft-listbox"
						value="storyline"
					>
						<p class="line-clamp-1">{storyline.title ? storyline.title : 'New Storyline'}</p>
					</ListBoxItem>
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
							bind:group={selectedItem}
							name="chapter"
							class="soft-listbox"
							value={chapter._id}
						>
							<div class="line-clamp-1 flex justify-between items-center">
								<p class="line-clamp-1">{chapter.title}</p>
								{#if !chapter.userPermissions?.view}
									<Icon data={lock} scale={1.2} />
								{/if}
							</div>
						</ListBoxItem>
					{/each}
				</ListBox>
			</svelte:fragment>
		</AccordionItem>
		<!-- ... -->
	</Accordion>
</div>
