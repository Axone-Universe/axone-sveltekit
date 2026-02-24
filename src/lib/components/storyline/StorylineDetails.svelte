<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
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

	$: title = storyline.title;
	const toastStore = getToastStore();

	// Track updated fields - initialize with id if storyline has one
	let updatedData: any = storyline._id ? { id: storyline._id } : {};

	// Track previous storyline._id to only reset when it actually changes
	let previousStorylineId: string | undefined = storyline._id?.toString();

	// Reset updatedData only when storyline._id actually changes (not just when it's truthy)
	$: {
		const currentStorylineId = storyline._id?.toString();
		if (currentStorylineId && currentStorylineId !== previousStorylineId) {
			updatedData = { id: storyline._id };
			genres = storyline.genres ?? [];
			tags = storyline.tags ?? [];
			previousImageURL = storyline.imageURL;
			previousStorylineId = currentStorylineId;
		}
	}

	// Initialize on mount
	onMount(() => {
		previousStorylineId = storyline._id?.toString();
		genres = storyline.genres ?? [];
		tags = storyline.tags ?? [];
		previousImageURL = storyline.imageURL;
	});

	// Handler functions that update both storyline and updatedData
	function handleTitleInput(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		storyline.title = value;
		updatedData.title = value;
	}

	function handleDescriptionInput(event: Event) {
		const value = (event.target as HTMLTextAreaElement).value;
		storyline.description = value;
		updatedData.description = value;
	}

	// Track imageURL changes (ImageUploader uses bind:imageURL, so we watch for changes)
	let previousImageURL = storyline.imageURL;
	$: if (
		storyline._id &&
		storyline.imageURL !== undefined &&
		storyline.imageURL !== previousImageURL
	) {
		updatedData.imageURL = storyline.imageURL;
		previousImageURL = storyline.imageURL;
	}

	// Track genres changes
	function handleGenresChange(newGenres: string[]) {
		genres = newGenres as any;
		storyline.genres = newGenres as any;
		updatedData.genres = newGenres;
	}

	// Track tags changes
	function handleTagsChange() {
		storyline.tags = tags;
		updatedData.tags = tags;
	}

	// Handle permissions changes from ManagePermissions component
	function handlePermissionsChange(event: CustomEvent<Record<string, any>>) {
		const newPermissions = event.detail;
		storyline.permissions = newPermissions;
		updatedData.permissions = newPermissions;
	}

	async function createStorylineData() {
		let response;
		let newStoryline = true;

		if (storyline._id) newStoryline = false;

		if (!imageFile && newStoryline) {
			const t: ToastSettings = {
				message: 'Please create and upload the storyline image cover',
				background: 'variant-filled-error'
			};
			toastStore.trigger(t);
			return;
		}

		if (!newStoryline) {
			// Only send updatedData for updates (it already includes the id)
			const updatePayload: any = {
				...updatedData
			};

			// If no changes detected (only id in updatedData), show a message and return
			const hasChanges = Object.keys(updatedData).filter((key) => key !== 'id').length > 0;
			if (!hasChanges) {
				const t: ToastSettings = {
					message: 'No changes detected',
					background: 'variant-filled-primary'
				};
				toastStore.trigger(t);
				return;
			}

			response = await trpc($page).storylines.update.mutate(updatePayload);
		} else {
			response = await trpc($page).storylines.create.mutate({
				title: storyline.title,
				description: storyline.description,
				book: storyline.book,
				parent: storyline.parent ?? undefined,
				parentChapter: storyline.parentChapter ?? undefined,
				permissions: storyline.permissions,
				genres,
				tags,
				imageURL: ''
			});
		}

		if (response.success) {
			storyline = response.data as HydratedDocument<StorylineProperties>;

			// Reset updatedData after successful save (include id if storyline has one)
			updatedData = storyline._id ? { id: storyline._id } : {};
			// Sync local state with storyline state
			genres = storyline.genres ?? [];
			tags = storyline.tags ?? [];

			const imageResponse = await uploadImage(
				supabase,
				`books/${book._id}/storylines/${storyline._id}`,
				imageFile,
				toastStore
			);
			if (imageResponse.url && imageResponse.url !== null) {
				await saveStorylineImage(imageResponse.url);
			} else if (imageResponse.error) {
				const t: ToastSettings = {
					message: imageResponse.error.message ?? 'Error uploading storyline cover',
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
		// Update storyline object when image is saved
		if (imageURL) {
			storyline.imageURL = imageURL;

			// Send update with only imageURL
			await trpc($page).storylines.update.mutate({
				id: storyline._id,
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
	<form on:submit|preventDefault={createStorylineData}>
		<div class="card p-2 sm:p-4 space-y-4">
			<div class="flex flex-col md:flex-row justify-between gap-2">
				<div class="flex flex-col w-full gap-2">
					<label for="storyline-title"> * Storyline Title </label>
					<input
						id="storyline-title"
						class="input"
						type="text"
						value={storyline.title}
						on:input={handleTitleInput}
						placeholder="Untitled Storyline"
						required
					/>

					<label for="storyline-description"> * Description </label>
					<textarea
						id="storyline-description"
						class="textarea w-full h-full overflow-hidden"
						value={storyline.description}
						on:input={handleDescriptionInput}
						required
					/>
				</div>
				<ImageUploader
					bind:imageURL={storyline.imageURL}
					bind:imageFile
					class="card w-full md:w-1/3 aspect-[2/3] h-fit overflow-hidden relative"
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
					bind:permissionedDocument={storyline}
					permissionedDocumentType="Storyline"
					on:permissionsChange={handlePermissionsChange}
				/>
			</div>

			<div class="flex flex-col justify-end sm:flex-row gap-2">
				<button type="button" class="btn variant-ghost-surface" on:click={cancelCallback}
					>Cancel</button
				>
				<button class="btn variant-filled" type="submit">
					{storyline._id ? 'Update' : 'Create'}
				</button>
			</div>
		</div>
	</form>
</div>
