<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
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

	// Track updated fields - initialize with id if book has one
	let updatedData: any = book._id ? { id: book._id } : {};

	// Track previous book._id to only reset when it actually changes
	let previousBookId: string | undefined = book._id?.toString();

	// Reset updatedData only when book._id actually changes (not just when it's truthy)
	$: {
		const currentBookId = book._id?.toString();
		if (currentBookId && currentBookId !== previousBookId) {
			updatedData = { id: book._id };
			genres = book.genres ?? [];
			tags = book.tags ?? [];
			previousImageURL = book.imageURL;
			previousBookId = currentBookId;
		}
	}

	// Initialize on mount
	onMount(() => {
		previousBookId = book._id?.toString();
		genres = book.genres ?? [];
		tags = book.tags ?? [];
		previousImageURL = book.imageURL;
	});

	// Handler functions that update both book and updatedData
	function handleTitleInput(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		book.title = value;
		updatedData.title = value;
	}

	function handleDescriptionInput(event: Event) {
		const value = (event.target as HTMLTextAreaElement).value;
		book.description = value;
		updatedData.description = value;
	}

	// Track imageURL changes (ImageUploader uses bind:imageURL, so we watch for changes)
	let previousImageURL = book.imageURL;
	$: if (book._id && book.imageURL !== undefined && book.imageURL !== previousImageURL) {
		updatedData.imageURL = book.imageURL;
		previousImageURL = book.imageURL;
	}

	// Track genres changes
	function handleGenresChange(newGenres: string[]) {
		genres = newGenres as any;
		book.genres = newGenres as any;
		updatedData.genres = newGenres;
	}

	// Track tags changes
	function handleTagsChange() {
		book.tags = tags;
		updatedData.tags = tags;
	}

	// Handle permissions changes from ManagePermissions component
	function handlePermissionsChange(event: CustomEvent<Record<string, any>>) {
		const newPermissions = event.detail;
		book.permissions = newPermissions;
		updatedData.permissions = newPermissions;
	}

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
			// Only send updatedData for updates (it already includes the id)
			// Include notifications if they exist
			const updatePayload: any = {
				...updatedData
			};

			if (Object.keys(notifications).length > 0) {
				updatePayload.notifications = notifications;
			}

			// If no changes detected (only id in updatedData), show a message and return
			const hasChanges = Object.keys(updatedData).filter((key) => key !== 'id').length > 0;
			if (!hasChanges && Object.keys(notifications).length === 0) {
				const t: ToastSettings = {
					message: 'No changes detected',
					background: 'variant-filled-primary'
				};
				toastStore.trigger(t);
				return;
			}

			response = await trpc($page).books.update.mutate(updatePayload);
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

			// Reset updatedData after successful save (include id if book has one)
			updatedData = book._id ? { id: book._id } : {};
			// Sync local state with book state
			genres = book.genres ?? [];
			tags = book.tags ?? [];

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
		// Update book object when image is saved
		if (imageURL) {
			book.imageURL = imageURL;

			// Send update with only imageURL
			await trpc($page).books.update.mutate({
				id: book._id,
				imageURL: imageURL
			});

			// Remove imageURL from updatedData since it's been saved separately
			if (updatedData.imageURL) {
				delete updatedData.imageURL;
			}
		}
	}
</script>

<div class="{customClass} w-modal">
	<form on:submit|preventDefault={createBookData}>
		<div class="card p-2 sm:p-4 space-y-4">
			<div class="flex flex-col md:flex-row justify-between gap-2">
				<div class="flex flex-col w-full gap-2">
					<label for="book-title"> * Book Title </label>
					<input
						id="title"
						class="input"
						type="text"
						value={book.title}
						on:input={handleTitleInput}
						placeholder="Untitled Book"
						required
					/>
					<label for="book-description">* Description </label>
					<textarea
						id="description"
						class="textarea w-full h-full overflow-hidden"
						value={book.description}
						on:input={handleDescriptionInput}
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
								let newGenres;
								if (index > -1) {
									newGenres = genres.filter((v) => v !== genre);
								} else {
									newGenres = [...genres, genre];
								}
								handleGenresChange(newGenres);
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
					on:valueChange={handleTagsChange}
				/>
			</div>
			<div>
				Permissions
				<ManagePermissions
					bind:permissionedDocument={book}
					{notifications}
					permissionedDocumentType="Book"
					on:permissionsChange={handlePermissionsChange}
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
