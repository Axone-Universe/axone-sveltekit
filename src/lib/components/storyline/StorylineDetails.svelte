<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { type ToastSettings, getToastStore, InputChip } from '@skeletonlabs/skeleton';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import type { HydratedDocument } from 'mongoose';
	import type { BookProperties } from '$lib/properties/book';
	import ManagePermissions from '../permissions/ManagePermissions.svelte';
	import ImageUploader from '../util/ImageUploader.svelte';
	import { uploadImage } from '$lib/util/bucket/bucket';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { GENRES } from '$lib/properties/genre';

	export let book: HydratedDocument<BookProperties>;
	export let storyline: HydratedDocument<StorylineProperties>;
	export let supabase: SupabaseClient;
	export let cancelCallback: () => void = () => undefined;
	export let title: string | undefined;

	let customClass = '';
	export { customClass as class };

	let imageFile: File;
	let genres = storyline.genres ?? [];
	let tags = storyline.tags ?? [];
	let notifications = {};

	$: title = storyline.title;
	const toastStore = getToastStore();

	async function createStorylineData() {
		let response;
		let newStoryline = false;

		if (!imageFile) {
			const t: ToastSettings = {
				message: 'Please create and upload the storyline image cover',
				background: 'variant-filled-error'
			};
			toastStore.trigger(t);
			return;
		}

		if (storyline._id) {
			response = await trpc($page).storylines.update.mutate({
				id: storyline._id,
				main: storyline.main,
				title: storyline.title,
				description: storyline.description,
				permissions: storyline.permissions,
				genres,
				tags,
				imageURL: storyline.imageURL,
				notifications: notifications
			});
		} else {
			newStoryline = true;
			response = await trpc($page).storylines.create.mutate({
				title: storyline.title,
				description: storyline.description,
				book: storyline.book,
				parent: storyline.parent ?? undefined,
				parentChapter: storyline.parentChapter ?? undefined,
				permissions: storyline.permissions,
				genres,
				tags,
				imageURL: '',
				notifications: notifications
			});
		}

		if (response.success) {
			storyline = response.data as HydratedDocument<StorylineProperties>;

			const imageResponse = await uploadImage(
				supabase,
				`books/${book._id}/storylines/${storyline._id}`,
				imageFile,
				toastStore
			);
			if (imageResponse.url && imageResponse.url !== null) {
				await saveStorylineImage(imageResponse.url);
			} else {
				const t: ToastSettings = {
					message: imageResponse.error?.message ?? 'Error uploading storyline cover',
					background: 'variant-filled-error'
				};
				toastStore.trigger(t);
			}

			if (newStoryline)
				await goto(
					`/editor/${book._id}?mode=writer&storylineID=${
						(storyline as HydratedDocument<ChapterProperties>)._id
					}`
				);
		}

		const t: ToastSettings = {
			message: response.message,
			background: 'variant-filled-primary'
		};
		toastStore.trigger(t);
	}

	async function saveStorylineImage(imageURL?: string) {
		await trpc($page).storylines.update.mutate({
			id: storyline._id,
			main: storyline.main,
			title: storyline.title,
			description: storyline.description,
			permissions: storyline.permissions,
			genres,
			imageURL: imageURL
		});
	}
</script>

<div class={`card p-2 sm:p-4 space-y-4 w-modal ${customClass}`}>
	<div class="flex justify-between gap-2">
		<div class="flex flex-col w-full">
			<label for="storyline-title"> * Storyline Title </label>
			<input
				id="storyline-title"
				class="input"
				type="text"
				bind:value={storyline.title}
				placeholder="Untitled Book"
				required
			/>

			<label for="storyline-description"> * Description </label>
			<textarea
				id="storyline-description"
				class="textarea w-full h-full overflow-hidden"
				bind:value={storyline.description}
				required
			/>
		</div>
		<ImageUploader
			bind:imageURL={storyline.imageURL}
			bind:imageFile
			class="card w-5/6 md:w-1/3 aspect-[2/3] h-fit overflow-hidden relative"
		/>
	</div>
	<div>
		Genres
		<div id="genres-div" class="flex flex-wrap gap-1">
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
	<div>
		Tags
		<InputChip
			bind:value={tags}
			name="tags"
			placeholder="e.g. #zombies"
			validation={(tag) => {
				return tag.startsWith('#');
			}}
		/>
	</div>
	<div>
		Permissions
		<ManagePermissions
			bind:permissionedDocument={storyline}
			{notifications}
			permissionedDocumentType="Storyline"
		/>
	</div>

	<div class="flex flex-col justify-end sm:flex-row gap-2">
		<button class="btn variant-ghost-surface" on:click={cancelCallback}>Cancel</button>
		<button class="btn variant-filled" on:click={createStorylineData}>
			{storyline._id ? 'Update' : 'Create'}
		</button>
	</div>
</div>
