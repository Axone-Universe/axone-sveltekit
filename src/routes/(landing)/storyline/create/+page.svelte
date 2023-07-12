<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import {
		Accordion,
		AccordionItem,
		ListBox,
		ListBoxItem,
		InputChip,
		type ToastSettings,
		toastStore
	} from '@skeletonlabs/skeleton';
	import { Icon } from 'svelte-awesome';
	import { check, pencil } from 'svelte-awesome/icons';
	import type { PageData } from './$types';
	import type { ChapterNode } from '$lib/nodes/digital-products/chapter';
	import { StorylinePropertyBuilder } from '$lib/util/storylines';
	import { afterUpdate } from 'svelte';

	const storylinePropertyBuilder = new StorylinePropertyBuilder();
	const storyline = storylinePropertyBuilder.getProperties();
	const genres = storyline.genres as unknown as Record<string, boolean>;

	export let data: PageData;
	$: ({ userAuthoredBookResponse: bookData, storylineResponse, chapterResponses } = data);

	afterUpdate(() => {
		// fill storyline genres with book ones
		let bookGenres = bookData.book.properties.genres!;
		let chapterID = $page.url.searchParams.get('chapterID')!;

		for (let bookGenre of bookGenres) {
			genres[bookGenre] = true;
		}

		storyline.bookID = bookData.book.properties.id;
		storyline.parentStorylineID = storylineResponse.storyline.properties.id;
		storyline.branchOffChapterID = chapterID;
	});

	async function createStoryline() {
		trpc($page)
			.storylines.create.mutate(storyline)
			.then(async (storylineResponse) => {
				const t: ToastSettings = {
					message: 'Storyline created successfully',
					background: 'variant-filled-primary'
				};
				toastStore.trigger(t);

				await goto(
					`/editor/${bookData.book.properties.id}?storylineID=${storylineResponse.storyline.properties.id}`
				);
			});
	}

	function filter(genre: string) {
		genres[genre] = !genres[genre];
	}

	let leftDrawerList: string;
	let selectedChapterNode: ChapterNode;
	function drawerItemSelected(chapter?: ChapterNode) {
		if (chapter) {
			selectedChapterNode = chapterResponses[chapter.properties.id].chapter;
		}
	}
</script>

<Container
	class="flex flex-col h-full space-y-4 mx-4 items-center md:space-y-0 md:items-start md:flex-row md:mx-32 xl:mx-80"
>
	<div class="card mx-2 w-5/6 md:w-2/6 h-full p-2">
		<Accordion>
			<AccordionItem open>
				<svelte:fragment slot="summary">
					<p class="text-lg font-bold">Book</p>
				</svelte:fragment>
				<svelte:fragment slot="content">
					<ListBox>
						<ListBoxItem
							on:change={() => drawerItemSelected()}
							bind:group={leftDrawerList}
							name="medium"
							class="soft-listbox"
							value="book"
						>
							{bookData.book.properties.title}
						</ListBoxItem>
					</ListBox>
				</svelte:fragment>
			</AccordionItem>
			<AccordionItem open>
				<svelte:fragment slot="summary">
					<p class="text-lg font-bold">Storylines</p>
				</svelte:fragment>
				<svelte:fragment slot="content">
					<ListBox>
						<ListBoxItem
							on:change={() => drawerItemSelected()}
							bind:group={leftDrawerList}
							name="medium"
							class="soft-listbox"
							value="copyright"
						>
							{storylineResponse.storyline.properties.title}
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
						{#each Object.entries(chapterResponses) as [id, chapterResponse]}
							<ListBoxItem
								on:change={() => drawerItemSelected(chapterResponse.chapter)}
								bind:group={leftDrawerList}
								name="chapter"
								class="soft-listbox"
								value={chapterResponse.chapter.properties.id}
							>
								<p class="line-clamp-1">{chapterResponse.chapter.properties.title}</p>
							</ListBoxItem>
						{/each}
					</ListBox>
				</svelte:fragment>
			</AccordionItem>
			<!-- ... -->
		</Accordion>
	</div>
	<div class="card p-4 h-full space-y-4 md:w-4/6">
		<label>
			Storyline Title
			<input class="input" type="text" bind:value={storyline.title} placeholder="Untitled Book" />
		</label>
		<label>
			Description
			<textarea class="textarea h-44 overflow-hidden" bind:value={storyline.description} />
		</label>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			Genres
			<div class="space-x-4 space-y-4 w-full h-auto">
				{#each Object.keys(genres) as genre}
					<span
						class="chip {genres[genre] ? 'variant-filled' : 'variant-soft'}"
						on:click={() => {
							filter(genre);
						}}
						on:keypress
					>
						{#if genres[genre]}<span><Icon data={check} /></span>{/if}
						<span class="capitalize">{genre}</span>
					</span>
				{/each}
			</div>
		</label>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			Tags
			<InputChip bind:value={storyline.tags} name="tags" placeholder="Enter any value..." />
		</label>

		<div class="flex flex-col sm:flex-row gap-4">
			<a class="btn variant-filled-error" href="/campaigns">Cancel</a>
			<button class="btn variant-filled-primary" on:click={createStoryline}>Create Storyline</button
			>
		</div>
	</div>
</Container>
