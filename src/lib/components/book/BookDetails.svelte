<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { trpcWithQuery } from '$lib/trpc/client';
	import { InputChip, type ToastSettings, toastStore } from '@skeletonlabs/skeleton';
	import { Icon } from 'svelte-awesome';
	import { check, pencil } from 'svelte-awesome/icons';
	import type { StorageError } from '$lib/util/types';
	import type { BookProperties } from '$lib/properties/book';
	import type { HydratedDocument } from 'mongoose';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import ManagePermissions from '$lib/components/permissions/ManagePermissions.svelte';
	import type { PermissionProperties } from '$lib/properties/permission';
	import { GENRES } from '$lib/properties/genre';

	const createBookMutation = trpcWithQuery($page).books.create.createMutation();

	let input: HTMLInputElement;
	let image: HTMLElement;
	let imageFile: File;

	export let book: HydratedDocument<BookProperties>;
	export let supabase: SupabaseClient;

	let customClass = '';
	export { customClass as class };

	let genres = book.genres ?? [];

	let permissions: Map<string, HydratedDocument<PermissionProperties>> = new Map();

	$: {
		if ($createBookMutation.isSuccess) {
			const t: ToastSettings = {
				message: 'Book created successfully',
				background: 'variant-filled-primary'
			};
			toastStore.trigger(t);
			goto(`/editor/${($createBookMutation.data as HydratedDocument<BookProperties>)._id}`);
		}
	}

	async function createBook() {
		if (!imageFile) {
			createBookData(null);
			return;
		}

		// save the book-cover first
		supabase.storage
			.from('book-covers')
			.upload(imageFile.name, imageFile)
			.then((response: StorageError) => {
				if (response.data) {
					let urlData = supabase.storage.from('book-covers').getPublicUrl(response.data.path);
					createBookData(urlData.data.publicUrl);
				} else {
					let message = 'Error uploading book cover';
					switch (response.error.statusCode) {
						case '409': {
							message = 'Image already exists';
							let urlData = supabase.storage.from('book-covers').getPublicUrl(imageFile.name);
							createBookData(urlData.data.publicUrl);
							break;
						}
						default: {
							createBookData('');
							break;
						}
					}

					const t: ToastSettings = {
						message: message,
						background: 'variant-filled-error'
					};
					toastStore.trigger(t);
				}
			});
	}

	async function createBookData(imageURL: string | null) {
		if (imageURL) {
			book.imageURL = imageURL;
		}

		$createBookMutation.mutate({
			title: book.title,
			description: book.description,
			imageURL: book.imageURL,
			genres: book.genres,
			permissions: Object.fromEntries(permissions) as any
		});
	}

	/**
	 * Called when the image file upload changes and uploads an image
	 */
	function onImageChange() {
		if (input.files === null) {
			return;
		}

		imageFile = input.files[0];

		if (imageFile) {
			const reader = new FileReader();
			reader.addEventListener('load', function () {
				image.setAttribute('src', reader.result as string);
			});
			reader.readAsDataURL(imageFile);

			return;
		}
	}

	function upload() {
		input.click();
	}
</script>

<div class={`${customClass}`}>
	<div class="card mx-2 w-5/6 md:w-2/6 aspect-[10/17] h-fit pb-2 card-hover">
		<div class="h-[87%]">
			<button>
				<img
					bind:this={image}
					class="{imageFile ? '' : 'hidden'} object-cover w-full aspect-[5/8]"
					src=""
					alt="cover"
				/>
			</button>
		</div>
		<footer class="flex flex-col items-center">
			<div class="overflow-hidden flex-auto flex items-center">
				<button on:click={upload} type="button" class="btn-icon bg-surface-200-700-token">
					<Icon class="p-2" data={pencil} scale={2.5} />
				</button>
				<input on:change={onImageChange} bind:this={input} type="file" hidden />
			</div>
		</footer>
	</div>

	<form on:submit|preventDefault={createBook} class="card p-4 space-y-4 md:w-full">
		<label>
			* Book Title
			<input
				class="input"
				type="text"
				bind:value={book.title}
				placeholder="Untitled Book"
				required
			/>
		</label>
		<label>
			* Description
			<textarea class="textarea h-44 overflow-hidden" bind:value={book.description} required />
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
			<InputChip bind:value={book.tags} name="tags" placeholder="Enter any value..." />
		</label>

		<div>
			Permissions
			<ManagePermissions bind:permissionedDocument={book} />
		</div>

		<div class="flex flex-col sm:flex-row gap-4">
			<a class="btn variant-filled-error" href="/campaigns">Cancel</a>
			<button class="btn variant-filled-primary" type="submit">Create Book</button>
		</div>
	</form>
</div>
