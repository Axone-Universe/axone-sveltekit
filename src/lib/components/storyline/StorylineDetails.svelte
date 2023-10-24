<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { InputChip, type ToastSettings, toastStore } from '@skeletonlabs/skeleton';
	import { Icon } from 'svelte-awesome';
	import { check } from 'svelte-awesome/icons';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import type { HydratedDocument } from 'mongoose';
	import type { BookProperties } from '$lib/properties/book';
	import { onMount } from 'svelte';
	import ManagePermissions from '../permissions/ManagePermissions.svelte';
	import BookNav from '../book/BookNav.svelte';
	import { GENRES, type Genre } from '$lib/properties/genre';

	export let book: HydratedDocument<BookProperties>;
	export let storyline: HydratedDocument<StorylineProperties>;

	let customClass = '';
	export { customClass as class };

	let bookGenres: Genre[] = [];
	let genres: Genre[] = [];

	onMount(() => {
		bookGenres = book.genres ?? [];
		genres = storyline.genres ?? [];
	});

	async function createStoryline() {
		trpc($page)
			.storylines.create.mutate({
				title: storyline.title,
				description: storyline.description,
				book: storyline.book,
				parent: storyline.parent,
				parentChapter: storyline.parentChapter,
				permissions: storyline.permissions
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

	let leftDrawerSelectedItem: string;
</script>

<div class={`${customClass}`}>
	<BookNav
		class="card mx-2 w-5/6 md:w-2/6 h-full p-2"
		storylines={[storyline]}
		bind:selectedChapter={leftDrawerSelectedItem}
	/>
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
				{#each GENRES as genre}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<span
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
						{#if genres.includes(genre)}<span><Icon data={check} /></span>{/if}
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
			<ManagePermissions bind:permissionedDocument={storyline} />
		</div>

		<div class="modal-footer flex justify-end space-x-2">
			<a href="/campaigns" class="btn variant-ghost-surface" type="button">Cancel</a>
			<button class="btn variant-filled" type="submit">Create Storyline</button>
		</div>
	</form>
</div>
