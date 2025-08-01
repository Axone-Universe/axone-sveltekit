<script lang="ts">
	import {
		resourceCollections,
		resourceLicenses,
		type HydratedResourceProperties
	} from '$lib/properties/resource';
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
	import { supabaseClient, supabaseSession } from '$lib/stores/supabase';
	import ImageWithFallback from '../util/ImageWithFallback.svelte';
	import { type TransactionProperties } from '$lib/properties/transaction';

	export let resource: HydratedDocument<HydratedResourceProperties>;

	const toastStore = getToastStore();
	const modalStore = getModalStore();
	const maxRoyalty = 50;

	$: supabase = $supabaseClient;
	$: session = $supabaseSession;

	let closeModal = () => {
		modalStore.close();
	};

	/**
	 * Uploads an resource to supabase storage
	 * @param newResourceFile - the file to upload or the event that contains the file
	 * @param resource - the resource
	 */
	async function saveResourceFile(newResourceFile: File | Event) {
		const response = await uploadResource(
			newResourceFile,
			editedResource as HydratedDocument<HydratedResourceProperties>,
			supabase,
			toastStore
		);

		if (response.success) {
			// update the db resource first then the quill object
			updateResource();
		} else {
			toastStore.trigger({
				message: response.message,
				// Provide any utility or variant background style:
				background: 'variant-filled-error'
			});
		}
	}

	async function updateResource() {
		let toastMessage = 'Saving Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.resources.update.mutate({
				id: editedResource._id,
				title: editedResource.title,
				description: editedResource.description,
				properties: editedResource.properties,
				src: editedResource.src,
				license: editedResource.license,
				price: editedResource.price,
				royalties: editedResource.royalties,
				nftCollection: editedResource.nftCollection
			})
			.then((response) => {
				resource = response.data as HydratedDocument<HydratedResourceProperties>;

				toastMessage = response.message;
				toastBackground = 'bg-success-500';

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(resource) : '';
				}
			})
			.catch((error) => {
				console.log('!! error');
				console.log(error.message);
				toastMessage = error.message ?? toastMessage;
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

	// Create a local copy for editing
	let editedResource = {
		...resource,
		nftCollection: resource.nftCollection ?? 'characters',
		properties: [...(resource.properties ?? [])]
	};

	$: isTokenizing = false;
	$: isListing = false;
	$: isBuying = false;

	// Validation for tokenize button
	$: canTokenize =
		editedResource.title?.trim() &&
		editedResource.src?.trim() &&
		editedResource.description?.trim() &&
		editedResource.royalties !== null &&
		editedResource.royalties !== undefined &&
		editedResource.nftCollection &&
		editedResource.license &&
		!editedResource.isTokenized;

	$: canList =
		editedResource.isTokenized && (editedResource.price ?? 0) > 0 && !editedResource.isListed;

	function addProperty() {
		editedResource.properties.push({ name: '', value: '' });
		editedResource = editedResource;
	}

	function removeProperty(index: number) {
		editedResource.properties.splice(index, 1);
		editedResource = editedResource;
	}

	function saveChanges() {
		// Update the original NFT with edited values
		if (resource._id) {
			updateResource();
		}
	}

	async function handleTokenize() {
		let toastMessage = 'Please save all changes before tokenizing';
		let toastBackground = 'variant-filled-error';

		if (JSON.stringify(editedResource) !== JSON.stringify(resource)) {
			console.log(editedResource);
			console.log(resource);
			toastStore.trigger({
				message: toastMessage,
				background: toastBackground
			});
			return;
		}

		if (!canTokenize) return;

		isTokenizing = true;

		trpc($page)
			.xumm.createToken.query({
				resourceId: editedResource._id
			})
			.then((response) => {
				toastMessage = response.message;
				toastBackground = response.success ? 'bg-success-500' : toastBackground;

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(resource) : '';
				}
			})
			.catch((error) => {
				console.log('!! error');
				console.log(error.message);
				toastMessage = error.message ?? toastMessage;
			})
			.finally(() => {
				let t: ToastSettings = {
					message: toastMessage,
					background: toastBackground,
					autohide: true
				};
				toastStore.trigger(t);
				modalStore.close();
				isTokenizing = false;
			});
	}

	async function handleList() {
		let toastMessage = 'Please save all changes before listing';
		let toastBackground = 'variant-filled-error';

		if (JSON.stringify(editedResource) !== JSON.stringify(resource)) {
			console.log(editedResource);
			console.log(resource);
			toastStore.trigger({
				message: toastMessage,
				background: toastBackground
			});
			return;
		}

		if (!canList) return;

		isListing = true;

		trpc($page)
			.xumm.listToken.query({
				resourceId: editedResource._id
			})
			.then((response) => {
				if (response.success) {
					toastMessage = response.message;
					toastBackground = response.success ? 'bg-success-500' : toastBackground;

					if ($modalStore[0]) {
						$modalStore[0].response ? $modalStore[0].response(resource) : '';
					}
				}
			})
			.catch((error) => {
				console.log('!! error');
				console.log(error.message);
				toastMessage = error.message ?? toastMessage;
			})
			.finally(() => {
				let t: ToastSettings = {
					message: toastMessage,
					background: toastBackground,
					autohide: true
				};
				toastStore.trigger(t);
				modalStore.close();
				isListing = false;
			});
	}

	async function handleBuy() {
		let toastMessage = 'Successfully completed transaction';
		let toastBackground = 'variant-filled-success';

		isBuying = true;

		let notifications: any = {};
		notifications[resource?.user?._id ?? ''] = {
			type: 'USER',
			senderID: session?.user.id,
			receiverID: resource?.user?._id ?? '',
			subject: 'Incoming NFT purchase!',
			url: $page.url.origin + '/monetize/earnings',
			notification: `You have received pending offer for your NFT!`
		};
		trpc($page)
			.xumm.buyToken.query({
				resourceId: editedResource._id,
				notifications: notifications
			})
			.then((response) => {
				if (response.success) {
					const transaction = response.data as HydratedDocument<TransactionProperties>;
					window.open(`/payment?payloadId=${transaction.payload?.uuid}`, '_blank');

					if ($modalStore[0]) {
						$modalStore[0].response ? $modalStore[0].response(resource) : '';
					}
				}
			})
			.catch((error) => {
				console.log('!! error');
				console.log(error.message);
				toastMessage = error.message ?? toastMessage;
			})
			.finally(() => {
				let t: ToastSettings = {
					message: toastMessage,
					background: toastBackground,
					autohide: true
				};
				toastStore.trigger(t);
				modalStore.close();
				isBuying = false;
			});
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

	function handleRoyaltyChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const num = parseFloat(input.value);

		if (num > maxRoyalty) {
			input.value = String(maxRoyalty); // update the input's visual value
			editedResource.royalties = maxRoyalty; // update the bound variable
		} else {
			editedResource.royalties = num;
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
		class="card rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden"
		on:click={(e) => e.stopPropagation()}
		on:keydown={handleKeyDown}
	>
		<!-- Modal content -->
		<div class="flex flex-col md:flex-row max-h-[calc(90vh-120px)]">
			<!-- Left side - Image -->
			<div class="md:w-2/3 p-8 flex flex-col items-center justify-center bg-surface-400-500-token">
				<div class="relative group m-6">
					<ImageWithFallback
						class="w-[200px] md:w-[500px] object-contain rounded-lg shadow-md"
						src={editedResource.src ?? 'null'}
						alt={editedResource.title ?? 'Resource Title'}
					/>
					<!-- Image upload overlay -->

					{#if session && session.user.id === resource?.user?._id && !resource.isTokenized}
						<div
							class="absolute inset-0 p-8 bg-surface-50-900-token bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-90 transition-opacity duration-300 rounded-lg cursor-pointer"
						>
							<FileDropzone name="resourceDropZone" on:change={(event) => saveResourceFile(event)}>
								<svelte:fragment slot="message"
									><div class="text-center">
										<p class="text-sm"><strong>Upload an image</strong> or drag and drop</p>
									</div></svelte:fragment
								>
								<svelte:fragment slot="meta">PNG, JPG, SVG, and GIF allowed.</svelte:fragment>
							</FileDropzone>
						</div>
					{/if}

					<!-- Status badges on modal image -->
					<div class="absolute top-3 left-3 flex flex-col gap-2">
						{#if editedResource.isTokenized}
							<span class="bg-green-500 px-2 py-1 rounded-full text-xs font-medium">
								Tokenized
							</span>
						{:else}
							<span class="bg-gray-500 px-2 py-1 rounded-full text-xs font-medium">
								Not Tokenized
							</span>
						{/if}

						{#if editedResource.isListed}
							<span class="bg-blue-500 px-2 py-1 rounded-full text-xs font-medium"> Listed </span>
						{:else}
							<span class="bg-orange-500 px-2 py-1 rounded-full text-xs font-medium">
								Not Listed
							</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Right side - Form -->
			<div class="md:w-1/2 p-6 overflow-y-auto">
				<form
					class="space-y-6"
					on:submit={(event) => {
						event.preventDefault();
						saveChanges();
					}}
				>
					<fieldset
						disabled={(session && session.user.id !== resource?.user?._id) || resource.isTokenized}
					>
						<!-- Title -->
						<div>
							<label for="title" class="block text-sm font-medium mb-2">Title *</label>
							<input
								id="title"
								type="text"
								bind:value={editedResource.title}
								class="input w-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
						</div>

						<!-- Description -->
						<div>
							<label for="description" class="block text-sm font-medium mb-2">Description *</label>
							<textarea
								id="description"
								bind:value={editedResource.description}
								rows="4"
								class="textarea w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
						</div>

						<!-- Collection Selection -->
						<div>
							<label for="collection" class="block text-sm font-medium mb-2">Collection *</label>
							<select
								id="collection"
								bind:value={editedResource.nftCollection}
								class="select w-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							>
								{#each resourceCollections as collection}
									<option value={collection}>{collection}</option>
								{/each}
							</select>
						</div>

						<!-- Price -->
						<div>
							<label for="price" class="block text-sm font-medium mb-2">Price</label>
							<input
								id="price"
								type="number"
								bind:value={editedResource.price}
								placeholder="e.g., 150 XRP"
								class="input w-full px-3 py-2 border focus:outline-none"
							/>
						</div>

						<!-- Royalties -->
						<div>
							<label for="royalties" class="block text-sm font-medium mb-2">
								Royalties (Max 50%) *
							</label>
							<input
								id="royalties"
								type="number"
								bind:value={editedResource.royalties}
								on:change={handleRoyaltyChange}
								min="0"
								max="100"
								step="0.1"
								class="input w-full px-3 py-2 border"
								aria-label="Royalties"
								required
							/>
							<p class="text-xs mt-1">Percentage given to creator on secondary sales</p>
						</div>

						<!-- license -->
						<div>
							<label for="license" class="block text-sm font-medium mb-2">License *</label>
							<select
								id="license"
								bind:value={editedResource.license}
								class="select w-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							>
								{#each resourceLicenses as license}
									<option value={license}>{license}</option>
								{/each}
							</select>
							<p class="text-xs mt-1">
								Listed from most to least permissive. <a
									target="_blank"
									class="text-blue-600 dark:text-blue-500 hover:underline"
									href="https://creativecommons.org/share-your-work/cclicenses/">Details</a
								>
							</p>
						</div>

						<!-- Properties -->
						<div>
							<div class="flex justify-between items-center mb-3">
								<label for="add-property-btn" class="block text-sm font-medium"
									>NFT Properties</label
								>
								<button
									id="add-property-btn"
									type="button"
									on:click={addProperty}
									class="button variant-filled rounded-full px-3 py-1 text-sm"
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
											class="input flex-1 px-3 py-2"
											aria-label="Property name"
										/>
										<input
											type="text"
											bind:value={property.value}
											placeholder="Property value"
											class="input flex-1 px-3 py-2 border"
											aria-label="Property value"
										/>
										<button
											type="button"
											on:click={() => removeProperty(index)}
											class="button text-red-600 hover:text-red-800 px-2 py-2"
											aria-label="Remove property"
										>
											×
										</button>
									</div>
								{/each}
							</div>
						</div>
					</fieldset>

					<!-- Action buttons for tokenizing and listing -->
					<div class="space-y-3 pt-4 border-t">
						<h3 class="text-lg font-medium">NFT Actions</h3>

						{#if session && session.user.id === resource?.user?._id && !resource.isListed}
							<!-- Tokenize button -->
							<button
								type="button"
								on:click={handleTokenize}
								disabled={!canTokenize || isTokenizing}
								class="button w-full bg-green-600 py-3 px-4 rounded-full hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
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
									Tokenized
								{:else}
									Tokenize NFT
								{/if}
							</button>

							{#if !canTokenize && !editedResource.isTokenized}
								<p class="text-xs text-error-600-300-token">
									Please upload a file and fill in title, description, collection, and royalties to
									tokenize
								</p>
							{/if}

							<!-- List button -->
							<button
								type="button"
								on:click={handleList}
								disabled={!canList || isListing}
								class="button w-full bg-blue-600 py-3 px-4 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
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
									Listed
								{:else}
									List on Marketplace
								{/if}
							</button>

							{#if editedResource.isTokenized && !editedResource.price && !editedResource.isListed}
								<p class="text-xs text-red-500">Please set a price to list on marketplace</p>
							{/if}
						{:else if resource.isListed}
							<button
								type="button"
								on:click={handleBuy}
								class="w-full button variant-ghost-secondary flex-1 py-2 px-4 rounded-full transition-colors font-medium"
							>
								{#if isBuying}
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
									Buying...
								{:else}
									Buy Token
								{/if}
							</button>
						{/if}
					</div>

					<!-- Save/Cancel buttons -->
					<div class="flex gap-3 pt-4 border-t">
						{#if session && session.user.id === resource?.user?._id && !resource.isTokenized}
							<button
								type="button"
								on:click={saveChanges}
								class="button variant-filled flex-1 py-2 px-4 rounded-full transition-colors font-medium"
							>
								Save Changes
							</button>
						{/if}
						<button
							type="button"
							on:click={closeModal}
							class="button variant-filled-primary variant-filled flex-1 py-2 px-4 rounded-full hover:bg-gray-400 transition-colors font-medium"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
