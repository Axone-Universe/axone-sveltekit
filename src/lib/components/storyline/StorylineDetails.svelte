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
	import { check } from 'svelte-awesome/icons';
	import type { StorylineProperties } from '$lib/shared/storyline';
	import type { ChapterProperties } from '$lib/shared/chapter';
	import type { HydratedDocument } from 'mongoose';
	import type { BookProperties } from '$lib/shared/book';
	import { onMount } from 'svelte';
	import ManagePermissions from '../permissions/ManagePermissions.svelte';
	import type { PermissionProperties } from '$lib/shared/permission';

	export let book: HydratedDocument<BookProperties>;
	export let storyline: HydratedDocument<StorylineProperties>;

	let customClass = '';
	export { customClass as class };

	let bookGenres: Record<string, boolean> = {};
	let genres: Record<string, boolean> = {};

	let permissions: { [key: string]: HydratedDocument<PermissionProperties> } = {};

	onMount(() => {
		bookGenres = book.genres as unknown as Record<string, boolean>;
		genres = storyline.genres as unknown as Record<string, boolean>;
		console.log(storyline.parent);
	});

	async function createStoryline() {
		console.log(storyline);
		trpc($page)
			.storylines.create.mutate({
				title: storyline.title,
				description: storyline.description,
				book: storyline.book,
				parent: storyline.parent,
				parentChapter: storyline.parentChapter,
				permissions: Object.values(permissions) as any
			})
			.then(async (storyline) => {
				const t: ToastSettings = {
					message: 'Storyline created successfully',
					background: 'variant-filled-primary'
				};
				toastStore.trigger(t);

				await goto(
					`/editor/${book._id}?storylineID=${
						(storyline as HydratedDocument<ChapterProperties>)._id
					}`
				);
			});
	}

	function filter(genre: string) {
		if (bookGenres[genre]) {
			return;
		}
		genres[genre] = !genres[genre];
	}

	let leftDrawerList: string;
	function drawerItemSelected(chapter?: HydratedDocument<ChapterProperties>) {}
</script>

<div class={`${customClass}`}>
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
							{book.title}
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
							{storyline.title ? storyline.title : 'New Storyline'}
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
						{#if storyline.chapters}
							{#each storyline.chapters as chapter}
								{#if typeof chapter !== 'string'}
									<ListBoxItem
										on:change={() => drawerItemSelected()}
										bind:group={leftDrawerList}
										name="chapter"
										class="soft-listbox"
										value={chapter._id}
									>
										<p class="line-clamp-1">{chapter.title}</p>
									</ListBoxItem>
								{/if}
							{/each}
						{/if}
					</ListBox>
				</svelte:fragment>
			</AccordionItem>
			<!-- ... -->
		</Accordion>
	</div>
	<form on:submit|preventDefault={createStoryline} class="card p-4 h-full space-y-4 md:w-4/6">
		<label>
			* Storyline Title
			<input
				class="input"
				type="text"
				bind:value={storyline.title}
				placeholder="Untitled Book"
				required
			/>
		</label>
		<label>
			* Description
			<textarea class="textarea h-44 overflow-hidden" bind:value={storyline.description} required />
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

		<div>
			Permissions
			<ManagePermissions {permissions} permissionedDocument={storyline} />
		</div>

		<div class="flex flex-col sm:flex-row gap-4">
			<a class="btn variant-filled-error" href="/campaigns">Cancel</a>
			<button class="btn variant-filled-primary" type="submit">Create Storyline</button>
		</div>
	</form>
</div>
