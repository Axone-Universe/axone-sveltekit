<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Container from '$lib/components/Container.svelte';
	import { trpc } from '$lib/trpc/client';
	import { BookPropertyBuilder } from '$lib/util/books';
	import { InputChip, type ToastSettings, toastStore } from '@skeletonlabs/skeleton';
	import { Icon } from 'svelte-awesome';
	import { check, pencil } from 'svelte-awesome/icons';
	import type { PageData } from './$types';
	import type { StorageError } from '$lib/util/types';

	const bookPropertyBuilder = new BookPropertyBuilder();
	const book = bookPropertyBuilder.getProperties();
	const genres = book.genres as unknown as Record<string, boolean>;

	let input: HTMLInputElement;
	let image: HTMLElement;
	let imageFile: File;

	export let data: PageData;
	const { supabase } = data;

	async function createBook() {
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
							//statements;
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

	async function createBookData(imageURL: string) {
		book.imageURL = imageURL;
		trpc($page)
			.books.create.mutate(book)
			.then(async (bookResponse) => {
				const t: ToastSettings = {
					message: 'Book created successfully',
					background: 'variant-filled-primary'
				};
				toastStore.trigger(t);
				await goto(`/editor/${bookResponse?.book.properties.id}`);
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

	function filter(genre: string) {
		genres[genre] = !genres[genre];
	}

	function upload() {
		input.click();
	}
</script>

<Container
	class="flex flex-col space-y-4 my-8 mx-4 items-center md:space-y-0 md:items-start md:flex-row md:mx-40 xl:mx-96"
>
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
	<div class="card p-4 space-y-4 md:w-full">
		<label>
			Book Title
			<input class="input" type="text" bind:value={book.title} placeholder="Untitled Book" />
		</label>
		<label>
			Description
			<textarea class="textarea h-44 overflow-hidden" bind:value={book.description} />
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
			<InputChip bind:value={book.tags} name="tags" placeholder="Enter any value..." />
		</label>

		<div class="flex flex-col sm:flex-row gap-4">
			<a class="btn variant-filled-error" href="/campaigns">Cancel</a>
			<button class="btn variant-filled-primary" on:click={createBook}>Create Book</button>
		</div>
	</div>
</Container>
