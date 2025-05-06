<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import {
		InputChip,
		type ToastSettings,
		getToastStore,
		type PopupSettings
	} from '@skeletonlabs/skeleton';
	import type { BookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';
	import { GENRES } from '$lib/properties/genre';
	import ImageUploader from '../util/ImageUploader.svelte';
	import { uploadImage } from '$lib/util/bucket/bucket';

	let notifications = {};

	export let book: HydratedDocument<BookProperties>;
	export let supabase: SupabaseClient;
	export let cancelCallback: () => void = () => {
		history.back();
	};
	let customClass = '';
	export { customClass as class };

	let imageFile: File;
	let genres = book.genres ?? [];
	let tags = book.tags ?? [];

	const toastStore = getToastStore();

	async function createBookData() {
		let response;
		let newBook = true;

		if (book._id) newBook = false;

		if (!imageFile && newBook) {
			const t: ToastSettings = {
				message: 'Please create and upload book cover',
				background: 'variant-filled-error'
			};
			toastStore.trigger(t);
			return;
		}

		if (!newBook) {
			response = await trpc($page).books.update.mutate({
				id: book._id,
				title: book.title,
				imageURL: book.imageURL,
				description: book.description,
				genres,
				tags,
				permissions: book.permissions,
				notifications: notifications
			});
		} else {
			response = await trpc($page).books.create.mutate({
				title: book.title,
				imageURL: book.imageURL,
				description: book.description,
				genres,
				tags,
				permissions: book.permissions,
				notifications: notifications
			});
		}

		if (response.success) {
			book = response.data as HydratedDocument<BookProperties>;

			const imageResponse = await uploadImage(supabase, `books/${book._id}`, imageFile, toastStore);
			if (imageResponse.url && imageResponse.url !== null) {
				await saveBookImage(imageResponse.url);
			} else if (imageResponse.error) {
				const t: ToastSettings = {
					message: imageResponse.error?.message ?? 'Error uploading book cover',
					background: 'variant-filled-error'
				};
				toastStore.trigger(t);
			}

			if (newBook) await goto(`/editor/${book._id}?mode=writer`);
		}

		const t: ToastSettings = {
			message: response.message,
			background: 'variant-filled-primary'
		};
		toastStore.trigger(t);
	}

	async function saveBookImage(imageURL?: string) {
		await trpc($page).books.update.mutate({
			id: book._id,
			title: book.title,
			imageURL: imageURL,
			description: book.description,
			genres,
			permissions: book.permissions
		});
	}
</script>

<div class="{customClass} w-modal">
	<form on:submit|preventDefault={createBookData}>
		<div class="card p-2 sm:p-4 space-y-4">
			<div class="flex justify-between gap-2">
				<div class="flex flex-col w-full gap-2">
					<label for="book-title"> * Book Title </label>
					<input
						id="title"
						class="input"
						type="text"
						bind:value={book.title}
						placeholder="Untitled Book"
						required
					/>
					<label for="book-description">* Description </label>
					<textarea
						id="description"
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
							type="button"
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
			<div id="tags-div">
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
					bind:permissionedDocument={book}
					{notifications}
					permissionedDocumentType="Book"
				/>
			</div>
			<div class="flex flex-col justify-end sm:flex-row gap-2">
				<button
					id="cancel-btn"
					type="button"
					class="btn variant-ghost-surface"
					on:click={cancelCallback}>Cancel</button
				>
				<button class="btn variant-filled" type="submit">
					{book._id ? 'Update' : 'Create'}
				</button>
			</div>
		</div>
	</form>
</div>
