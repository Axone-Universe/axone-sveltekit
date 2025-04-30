<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { trpc } from '$lib/trpc/client';
	import { TagsInput } from '@skeletonlabs/skeleton-svelte';
	import type { BookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';
	import { GENRES } from '$lib/properties/genre';
	import ImageUploader from '../util/ImageUploader.svelte';
	import { uploadImage } from '$lib/util/bucket/bucket';
	import { toaster } from '$lib/util/toaster/toaster-svelte';

	let notifications = {};

	/** props */

	let {
		book = $bindable(),
		supabase = $bindable(),
		cancelCallback,
		class: customClass
	}: {
		book: HydratedDocument<BookProperties>;
		supabase: SupabaseClient;
		cancelCallback: () => void;
		class: string;
	} = $props();

	cancelCallback =
		cancelCallback ??
		(() => {
			history.back();
		});
	customClass = customClass ?? '';

	/** variables */

	let imageFile: File | undefined = $state(undefined);
	let genres = $state(book.genres ?? []);
	let tags = $state(book.tags ?? []);

	async function createBookData(event: SubmitEvent) {
		event.preventDefault();

		let response;
		let newBook = true;

		if (book._id) newBook = false;

		if (!imageFile && newBook) {
			toaster.error({
				title: 'Please create and upload book cover'
			});
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

			const imageResponse = await uploadImage(supabase, `books/${book._id}`, imageFile);
			if (imageResponse.url && imageResponse.url !== null) {
				await saveBookImage(imageResponse.url);
			} else if (imageResponse.error) {
				toaster.error({
					title: imageResponse.error?.message ?? 'Error uploading book cover'
				});
			}

			if (newBook) await goto(`/editor/${book._id}?mode=writer`);
		}

		toaster.success({
			title: response.message
		});
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
	<form onsubmit="{createBookData}">
		<div class="card p-2 sm:p-4 space-y-4">
			<div class="flex justify-between gap-2">
				<div class="flex flex-col w-full gap-2">
					<label for="book-title"> * Book Title </label>
					<input
						id="title"
						class="input"
						type="text"
						bind:value="{book.title}"
						placeholder="Untitled Book"
						required
					/>
					<label for="book-description">* Description </label>
					<textarea
						id="description"
						class="textarea w-full h-full overflow-hidden"
						bind:value="{book.description}"
						required></textarea>
				</div>
				<ImageUploader
					bind:imageURL="{book.imageURL}"
					bind:imageFile="{imageFile}"
					class="card w-5/6 md:w-1/3 aspect-2/3 h-fit overflow-hidden relative"
				/>
			</div>
			<div>
				Genres
				<div id="genres-div" class="flex flex-wrap gap-1">
					{#each GENRES as genre}
						<!-- svelte-ignore event_directive_deprecated -->
						<button
							class="chip {genres.includes(genre) ? 'preset-filled' : 'preset-tonal'}"
							onclick="{() => {
								const index = genres.indexOf(genre);
								if (index > -1) {
									genres = genres.filter((v) => v !== genre);
								} else {
									genres = [...genres, genre];
								}
							}}"
						>
							<span class="capitalize">{genre}</span>
						</button>
					{/each}
				</div>
			</div>
			<div id="tags-div">
				Tags
				<!-- svelte-ignore attribute_quoted -->
				<TagsInput
					value="{tags}"
					name="tags"
					placeholder="e.g. #zombies"
					validate="{(details) => {
						return details.inputValue.startsWith('#');
					}}"
				/>
			</div>
			<div>
				Permissions
				<ManagePermissions
					bind:permissionedDocument="{book}"
					notifications="{notifications}"
					permissionedDocumentType="Book"
				/>
			</div>
			<div class="flex flex-col justify-end sm:flex-row gap-2">
				<button
					id="cancel-btn"
					type="button"
					class="btn preset-tonal-surface border border-surface-500"
					onclick="{cancelCallback}">Cancel</button
				>
				<button class="btn preset-filled" type="submit">
					{book._id ? 'Update' : 'Create'}
				</button>
			</div>
		</div>
	</form>
</div>
