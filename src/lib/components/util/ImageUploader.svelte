<script lang="ts">
	import Icon from 'svelte-awesome';
	import { pencil, remove } from 'svelte-awesome/icons';

	export let imageURL: string | undefined;
	export let imageFile: File;

	let input: HTMLInputElement;
	let currentImagePath = imageURL ?? '';
	let additionalClasses = '';
	export { additionalClasses as class };

	function removeImage() {
		currentImagePath = '';
		imageURL = '';
	}

	function onImageChange() {
		if (input.files === null) {
			return;
		}

		imageFile = input.files[0];

		if (imageFile) {
			const reader = new FileReader();
			reader.addEventListener('load', function () {
				currentImagePath = reader.result as string;
			});
			reader.readAsDataURL(imageFile);

			return;
		}
	}
</script>

<div id="image-uploader-div" class={additionalClasses}>
	<img
		class="{!imageFile && !imageURL && 'hidden'} object-cover w-full"
		src={currentImagePath}
		alt=""
	/>
	<div class="flex justify-center items-center gap-2 absolute inset-x-0 bottom-2">
		<button
			on:click={() => input.click()}
			type="button"
			class="btn-icon btn-icon-sm sm:btn-icon-base bg-surface-200-700-token"
		>
			<Icon class="p-2" data={pencil} scale={2.5} />
		</button>
		<button
			on:click={removeImage}
			type="button"
			class="btn-icon btn-icon-sm sm:btn-icon-base bg-surface-200-700-token"
		>
			<Icon class="p-2" data={remove} scale={2.5} />
		</button>
		<input on:change={onImageChange} bind:this={input} type="file" hidden />
	</div>
</div>
