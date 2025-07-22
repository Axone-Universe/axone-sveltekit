<script lang="ts">
	import { type ResourceProperties } from '$lib/properties/resource';
	import type { Resource } from '$lib/util/editor/quill';
	import { FileButton, getModalStore } from '@skeletonlabs/skeleton';
	import { type HydratedDocument } from 'mongoose';

	export let resource: HydratedDocument<ResourceProperties>;
	export let uploadClick: (file: File, resource: HydratedDocument<ResourceProperties>) => void;

	const modalStore = getModalStore();
	/**
	 * Change the image of the resource to the one selected by the user
	 * Calls the uploadClick function to upload the image to Supabase
	 * @param event
	 */
	function changeImage(event: Event) {
		const inputElement = event.target as HTMLInputElement;
		const file = inputElement.files?.[0];

		if (!file) {
			return; // No file selected
		}

		const imageElement = document.getElementById(`modal-image`) as HTMLImageElement;
		const reader = new FileReader();
		reader.onload = (e) => {
			if (e.target?.result) {
				imageElement.src = e.target.result as string;
			}
		};
		reader.readAsDataURL(file);

		uploadClick(file, resource);
	}
</script>

<div class="rounded-[14px] bg-surface-700 p-4 max-w-[45%] max-h-[45%]">
	<main class="mb-4">
		<img
			id="modal-image"
			class="rounded-lg max-w-[100%] max-h-[100%]"
			src={resource?.src || ''}
			alt={resource?.alt || resource?.src || ''}
		/>
	</main>
	<footer class="flex flex-row-reverse">
		<button class="btn btn-sm variant-filled ml-3" on:click={() => modalStore.close()}>
			close
		</button>
		<FileButton
			type="file"
			name={resource._id}
			accept="image/png, image/jpeg, image/gif, image/svg"
			button="btn-icon btn-sm variant-ringed-primary"
			on:change={changeImage}
		>
			<img class="w-16 h-8 mb-2" src="/upload.svg" alt="upload" />
		</FileButton>
	</footer>
</div>
<slot />
