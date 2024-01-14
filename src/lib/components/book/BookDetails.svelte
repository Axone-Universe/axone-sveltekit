<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { InputChip, type ToastSettings, getToastStore } from '@skeletonlabs/skeleton';
	import type { BookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';
	import { GENRES } from '$lib/properties/genre';
	import ImageUploader from '../util/ImageUploader.svelte';
	import { uploadBookCover } from '$lib/util/bucket/bucket';

	let notifications = {};

	export let book: HydratedDocument<BookProperties>;
	export let supabase: SupabaseClient;
	export let cancelCallback: () => void = () => undefined;
	export let createCallback: (() => void) | undefined = undefined;
	let customClass = '';
	export { customClass as class };

	let imageFile: File;
	let genres = book.genres ?? [];
	$: tags = book.tags ?? [];

	const toastStore = getToastStore();

	async function createBook() {
		if (!imageFile) {
			createBookData();
			return;
		}

		const url = await uploadBookCover(supabase, imageFile);

		if (url) {
			createBookData(url);
			return;
		}

		const t: ToastSettings = {
			message: 'Error uploading book cover',
			background: 'variant-filled-error'
		};
		toastStore.trigger(t);
	}

	async function createBookData(imageURL?: string) {
		try {
			let newBook = false;
			let response;
			if (book._id) {
				response = await trpc($page).books.update.mutate({
					id: book._id,
					title: book.title,
					description: book.description,
					imageURL: imageURL ?? book.imageURL,
					genres,
					permissions: book.permissions
				});
			} else {
				newBook = true;
				response = await trpc($page).books.create.mutate({
					title: book.title,
					description: book.description,
					imageURL: imageURL ?? '',
					genres,
					permissions: book.permissions
				});
			}

			book = response.data as HydratedDocument<BookProperties>;

			const t: ToastSettings = {
				message: response.message,
				background: 'variant-filled-primary'
			};
			toastStore.trigger(t);

			if (newBook) await goto(`/editor/${book._id}?mode=writer`);

			if (createCallback !== undefined) {
				createCallback();
			}
		} catch (e) {
			console.log(e);
		}
	}
</script>

<div class="{customClass} w-modal">
	<div class="card p-2 sm:p-4 space-y-4">
		<div class="flex justify-between gap-2">
			<div class="flex flex-col w-full gap-2">
				<label for="book-title"> * Book Title </label>
				<input
					id="book-title"
					class="input"
					type="text"
					bind:value={book.title}
					placeholder="Untitled Book"
					required
				/>
				<label for="book-description">* Description </label>
				<textarea
					id="book-description"
					class="textarea w-full h-full overflow-hidden"
					bind:value={book.description}
					required
				/>
			</div>
			<ImageUploader
				bind:imageURL={book.imageURL}
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
			<InputChip bind:value={tags} name="tags" placeholder="Enter any value..." />
		</div>
		<div>
			Permissions
			<ManagePermissions
				bind:permissionedDocument={book}
				{notifications}
				permissionedDocumentType="Book"
			/>
		</div>
		<div class="flex flex-col justify-end sm:flex-row gap-2">
			<button id="cancel-btn" class="btn variant-ghost-surface" on:click={cancelCallback}
				>Cancel</button
			>
			<button class="btn variant-filled" type="submit" on:click={createBook}>
				{book._id ? 'Update' : 'Create'}
			</button>
		</div>
	</div>
</div>
