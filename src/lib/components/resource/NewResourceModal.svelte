<script lang="ts">
	import type { HydratedResourceProperties, ResourceProperties } from '$lib/properties/resource';
	import {
		FileDropzone,
		getModalStore,
		getToastStore,
		type ToastSettings
	} from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';
	import type { HydratedDocument } from 'mongoose';
	import { uploadResource } from '$lib/util/constants';
	import { supabaseClient } from '$lib/stores/supabase';

	export let resource: HydratedDocument<HydratedResourceProperties>;
	export let disabled: false;

	let customClass = '';
	export { customClass as class };

	const toastStore = getToastStore();
	const modalStore = getModalStore();
	$: supabase = $supabaseClient;

	async function submit() {
		// permissions = permissions.map
		if (resource._id) {
			updateResource();
		}

		return false;
	}

	let closeModal = () => {
		modalStore.close();
	};

	async function updateResource() {
		let toastMessage = 'Saving Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.resources.update.mutate({
				id: resource._id,
				title: resource.title,
				description: resource.description
			})
			.then((response) => {
				resource = response.data as HydratedDocument<HydratedResourceProperties>;
				toastMessage = response.message;
				toastBackground = 'bg-success-500';

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(resource) : '';
				}
			})
			.finally(() => {
				let t: ToastSettings = {
					message: toastMessage,
					background: toastBackground,
					autohide: true
				};
				toastStore.trigger(t);
				modalStore.close();
			});
	}

	// Available collections
	const collections = [
		'Axone Universe Characters',
		'Axone Universe Places',
		'Axone Universe Artifacts'
	];

	// Create a local copy for editing
	$: editedResource = {
		...resource,
		properties: [...(resource.properties ?? [])]
	};

	$: isTokenizing = false;
	$: isListing = false;

	// Validation for tokenize button
	$: canTokenize =
		editedResource.title?.trim() &&
		editedResource.description?.trim() &&
		editedResource.royalties !== null &&
		editedResource.royalties !== undefined &&
		editedResource.collection &&
		!editedResource.isTokenized;

	$: canList =
		editedResource.isTokenized && (editedResource.price ?? 0) > 0 && !editedResource.isListed;

	function addProperty() {
		editedResource.properties.push({ name: '', value: '' });
	}

	function removeProperty(index: number) {
		editedResource.properties.splice(index, 1);
	}

	function saveChanges() {
		// Update the original NFT with edited values
		Object.assign(resource, editedResource);
		closeModal();
	}

	/**
	 * Uploads an resource to supabase storage
	 * @param newResourceFile - the file to upload or the event that contains the file
	 * @param resource - the resource
	 */
	async function saveResource(newResourceFile: File | Event) {
		const response = await uploadResource(newResourceFile, resource, supabase, toastStore);

		if (response.success) {
			// update the db resource first then the quill object
			trpc($page)
				.resources.update.mutate({
					id: resource._id,
					src: resource.src
				})
				.then((response) => {
					toastStore.trigger({
						message: response.message,
						background: response.success ? 'bg-success-500' : 'variant-filled-error'
					});
				});
		} else {
			toastStore.trigger({
				message: response.message,
				// Provide any utility or variant background style:
				background: 'variant-filled-error'
			});
		}
	}

	async function handleTokenize() {
		if (!canTokenize) return;

		isTokenizing = true;

		try {
			// Simulate API call to tokenize NFT
			await new Promise((resolve) => setTimeout(resolve, 2000));

			editedResource.isTokenized = true;
			alert('NFT successfully tokenized!');
		} catch (error) {
			alert('Failed to tokenize NFT. Please try again.');
		} finally {
			isTokenizing = false;
		}
	}

	async function handleList() {
		if (!canList) return;

		isListing = true;

		try {
			// Simulate API call to list NFT on marketplace
			await new Promise((resolve) => setTimeout(resolve, 2000));

			editedResource.isListed = true;
			alert('NFT successfully listed on marketplace!');
		} catch (error) {
			alert('Failed to list NFT. Please try again.');
		} finally {
			isListing = false;
		}
	}

	function handleBackdropClick(event: { target: any; currentTarget: any }) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleKeyDown(event: { key: string; preventDefault: () => void }) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeModal();
		}
	}
</script>

<!-- Modal backdrop -->
<div
	class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
	on:click={handleBackdropClick}
	on:keydown={handleKeyDown}
	role="dialog"
	aria-modal="true"
	aria-labelledby="modal-title"
>
	<div
		class="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden"
		on:click={(e) => e.stopPropagation()}
		on:keydown={handleKeyDown}
	>
		<!-- Modal header -->
		<div class="flex justify-between items-center p-6 border-b">
			<h2 id="modal-title" class="text-2xl font-bold text-gray-900">Edit NFT Details</h2>
			<button on:click={closeModal} class="text-gray-500 hover:text-gray-700 text-2xl"> × </button>
		</div>

		<!-- Modal content -->
		<div class="flex flex-col lg:flex-row max-h-[calc(90vh-120px)]">
			<!-- Left side - Image -->
			<div class="lg:w-1/2 p-6 flex flex-col items-center justify-center bg-gray-50">
				<div class="relative group">
					<img
						src={editedResource.src || '/placeholder.svg'}
						alt={editedResource.title}
						class="max-w-full max-h-80 object-contain rounded-lg shadow-md"
					/>

					<!-- Image upload overlay -->

					<FileDropzone
						class="absolute inset-0 bg-surface-50-900-token bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg cursor-pointer"
						name="resourceDropZone"
						on:change={(event) => saveResource(event)}
					>
						<svelte:fragment slot="message"
							><div class="text-white text-center">
								<svg
									class="w-8 h-8 mx-auto mb-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
									/>
								</svg>
								<p class="text-sm"><strong>Upload an image</strong> or drag and drop</p>
							</div></svelte:fragment
						>
						<svelte:fragment slot="meta">PNG, JPG, SVG, and GIF allowed.</svelte:fragment>
					</FileDropzone>

					<!-- Status badges on modal image -->
					<div class="absolute top-3 left-3 flex flex-col gap-2">
						{#if editedResource.isTokenized}
							<span class="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
								Tokenized
							</span>
						{:else}
							<span class="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
								Not Tokenized
							</span>
						{/if}

						{#if editedResource.isListed}
							<span class="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
								Listed
							</span>
						{:else if editedResource.isTokenized}
							<span class="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
								Not Listed
							</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Right side - Form -->
			<div class="lg:w-1/2 p-6 overflow-y-auto">
				<form
					class="space-y-6"
					on:submit={(event) => {
						event.preventDefault();
						saveChanges();
					}}
				>
					<!-- Title -->
					<div>
						<label for="title" class="block text-sm font-medium text-gray-700 mb-2">Title *</label>
						<input
							id="title"
							type="text"
							bind:value={editedResource.title}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							required
						/>
					</div>

					<!-- Description -->
					<div>
						<label for="description" class="block text-sm font-medium text-gray-700 mb-2"
							>Description *</label
						>
						<textarea
							id="description"
							bind:value={editedResource.description}
							rows="4"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							required
						/>
					</div>

					<!-- Collection Selection -->
					<div>
						<label for="collection" class="block text-sm font-medium text-gray-700 mb-2"
							>Collection *</label
						>
						<select
							id="collection"
							bind:value={editedResource.collection}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							required
						>
							<option value="">Select a collection</option>
							{#each collections as collection}
								<option value={collection}>{collection}</option>
							{/each}
						</select>
					</div>

					<!-- Price -->
					<div>
						<label for="price" class="block text-sm font-medium text-gray-700 mb-2">Price</label>
						<input
							id="price"
							type="text"
							bind:value={editedResource.price}
							placeholder="e.g., 150 XRP"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						/>
					</div>

					<!-- Properties -->
					<div>
						<div class="flex justify-between items-center mb-3">
							<label class="block text-sm font-medium text-gray-700">NFT Properties</label>
							<button
								type="button"
								on:click={addProperty}
								class="bg-purple-600 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-700 transition-colors"
							>
								Add Property
							</button>
						</div>

						<div class="space-y-3">
							{#each editedResource.properties as property, index}
								<div class="flex gap-2 items-center">
									<input
										type="text"
										bind:value={property.name}
										placeholder="Property name"
										class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
										aria-label="Property name"
									/>
									<input
										type="text"
										bind:value={property.value}
										placeholder="Property value"
										class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
										aria-label="Property value"
									/>
									<button
										type="button"
										on:click={() => removeProperty(index)}
										class="text-red-600 hover:text-red-800 px-2 py-2"
										aria-label="Remove property"
									>
										×
									</button>
								</div>
							{/each}
						</div>
					</div>

					<!-- Royalties -->
					<div>
						<label for="royalties" class="block text-sm font-medium text-gray-700 mb-2">
							Royalties (%) *
						</label>
						<input
							id="royalties"
							type="number"
							bind:value={editedResource.royalties}
							min="0"
							max="100"
							step="0.1"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							aria-label="Royalties"
							required
						/>
						<p class="text-xs text-gray-500 mt-1">Percentage given to creator on secondary sales</p>
					</div>

					<!-- Action buttons for tokenizing and listing -->
					<div class="space-y-3 pt-4 border-t">
						<h3 class="text-lg font-medium text-gray-900">NFT Actions</h3>

						<!-- Tokenize button -->
						<button
							type="button"
							on:click={handleTokenize}
							disabled={!canTokenize || isTokenizing}
							class="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
						>
							{#if isTokenizing}
								<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								Tokenizing...
							{:else if editedResource.isTokenized}
								Already Tokenized
							{:else}
								Tokenize NFT
							{/if}
						</button>

						{#if !canTokenize && !editedResource.isTokenized}
							<p class="text-xs text-red-500">
								Please fill in title, description, collection, and royalties to tokenize
							</p>
						{/if}

						<!-- List button -->
						<button
							type="button"
							on:click={handleList}
							disabled={!canList || isListing}
							class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
						>
							{#if isListing}
								<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								Listing...
							{:else if editedResource.isListed}
								Already Listed
							{:else if !editedResource.isTokenized}
								Tokenize First
							{:else}
								List on Marketplace
							{/if}
						</button>

						{#if editedResource.isTokenized && !editedResource.price && !editedResource.isListed}
							<p class="text-xs text-red-500">Please set a price to list on marketplace</p>
						{/if}
					</div>

					<!-- Save/Cancel buttons -->
					<div class="flex gap-3 pt-4 border-t">
						<button
							type="button"
							on:click={saveChanges}
							class="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-medium"
						>
							Save Changes
						</button>
						<button
							type="button"
							on:click={closeModal}
							class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors font-medium"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
