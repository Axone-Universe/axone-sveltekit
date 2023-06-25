<script lang="ts">
	import type { ChapterNode, ChapterProperties } from '$lib/nodes/digital-products/chapter';
	import type { UserAuthoredBookResponse } from '$lib/nodes/user';
	import { modalStore, Avatar, toastStore, type ToastSettings } from '@skeletonlabs/skeleton';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';

	import Icon from 'svelte-awesome';
	import { user, star, close } from 'svelte-awesome/icons';

	export let chapterNode: ChapterNode;

	let customClass = '';
	export { customClass as class };

	let chapterProperties: ChapterProperties = chapterNode.properties;

	let closeModal = () => {
		modalStore.close();
	};

	async function submit() {
		let toastMessage = 'Saving Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.chapters.update.mutate({
				id: chapterNode.properties.id,
				description: chapterProperties.description
			})
			.then((chapterNodeResponse) => {
				chapterNode.properties = chapterNodeResponse.chapter.properties;
				toastMessage = 'Sunccessfully Saved';
				toastBackground = 'bg-success-500';
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

		return false;
	}
</script>

<form class={`modal-example-form card p-4 w-modal shadow-xl space-y-4 ${customClass}`}>
	<header class="text-2xl font-bold text-center">{chapterNode.properties.title}</header>
	<div class="modal-form border border-surface-500 p-4 space-y-4 rounded-container-token">
		<label>
			*Chapter Description
			<textarea
				class="textarea h-44 overflow-hidden"
				bind:value={chapterProperties.description}
				required
			/>
		</label>
	</div>
	<footer class="modal-footer flex justify-end space-x-2">
		<button on:click={closeModal} class="btn variant-ghost-surface">Cancel</button>
		<button on:click={submit} class="btn variant-filled" type="submit">Save</button>
	</footer>
</form>
