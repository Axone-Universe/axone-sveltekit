<script lang="ts">
	import { modalStore } from '@skeletonlabs/skeleton';

	let customClass = '';
	export { customClass as class };

	let closeModal = () => {
		modalStore.close();
	};

	async function submit() {
		modalStore.close();
	}
</script>

<form
	on:submit|preventDefault={submit}
	class={`modal-example-form card p-4 w-modal shadow-xl space-y-4 ${customClass}`}
>
	<div class="modal-form p-4 space-y-4 rounded-container-token">
		<label>
			* Note Title

			<input class="input" type="text" placeholder="Chapter Title" required />
		</label>
		<label>
			* Note Content
			<textarea class="textarea h-44 overflow-hidden" required />
		</label>
	</div>
	<footer class="modal-footer flex justify-end space-x-2">
		<button on:click={closeModal} class="btn variant-ghost-surface" type="button">Cancel</button>
		<button class="btn variant-filled" type="submit">Save</button>
	</footer>
</form>
