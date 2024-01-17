<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { type ToastSettings, getToastStore } from '@skeletonlabs/skeleton';
	import type { StorylineProperties } from '$lib/properties/storyline';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import type { HydratedDocument } from 'mongoose';
	import type { BookProperties } from '$lib/properties/book';
	import ManagePermissions from '../permissions/ManagePermissions.svelte';
	import ImageUploader from '../util/ImageUploader.svelte';
	import { uploadBookCover } from '$lib/util/bucket/bucket';
	import type { SupabaseClient } from '@supabase/supabase-js';

	export let book: HydratedDocument<BookProperties>;
	export let storyline: HydratedDocument<StorylineProperties>;
	export let supabase: SupabaseClient;
	export let cancelCallback: () => void = () => undefined;
	export let createCallback: (() => void) | undefined = undefined;
	export let title: string | undefined;

	let customClass = '';
	export { customClass as class };

	let imageFile: File;
	let notifications = {};

	$: title = storyline.title;
	const toastStore = getToastStore();

	async function createStoryline() {
		if (!imageFile) {
			createStorylineData();
			return;
		}

		const url = await uploadBookCover(supabase, imageFile);

		if (url) {
			createStorylineData(url);
			return;
		}

		const t: ToastSettings = {
			message: 'Error uploading book cover',
			background: 'variant-filled-error'
		};
		toastStore.trigger(t);
	}

	async function createStorylineData(imageURL?: string) {
		let response;
		let newStoryline = false;
		if (storyline._id) {
			response = await trpc($page).storylines.update.mutate({
				id: storyline._id,
				title: storyline.title,
				description: storyline.description,
				permissions: storyline.permissions,
				imageURL: imageURL ?? storyline.imageURL,
				notifications: notifications
			});
		} else {
			newStoryline = true;
			response = await trpc($page).storylines.create.mutate({
				title: storyline.title,
				description: storyline.description,
				book: storyline.book,
				parent: storyline.parent,
				parentChapter: storyline.parentChapter,
				permissions: storyline.permissions,
				imageURL: imageURL ?? ''
			});
		}

		storyline = response.data as HydratedDocument<StorylineProperties>;

		const t: ToastSettings = {
			message: response.message,
			background: 'variant-filled-primary'
		};
		toastStore.trigger(t);

		if (newStoryline)
			await goto(
				`/editor/${book._id}?storylineID=${(storyline as HydratedDocument<ChapterProperties>)._id}`
			);

		if (createCallback !== undefined) {
			createCallback();
		}
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
		Permissions
		<ManagePermissions
			bind:permissionedDocument={storyline}
			{notifications}
			permissionedDocumentType="Storyline"
		/>
	</div>

	<div class="flex flex-col justify-end sm:flex-row gap-2">
		<button class="btn variant-ghost-surface" on:click={cancelCallback}>Cancel</button>
		<button class="btn variant-filled" on:click={createStoryline}>
			{storyline._id ? 'Update' : 'Create'}
		</button>
	</div>
</div>
