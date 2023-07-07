<script lang="ts">
	import type { ChapterNode, ChapterProperties } from '$lib/nodes/digital-products/chapter';
	import type { UserAuthoredBookResponse } from '$lib/nodes/user';
	import { modalStore, Avatar, toastStore, type ToastSettings } from '@skeletonlabs/skeleton';
	import { Integer } from 'neo4j-driver';
	import { Node } from 'neo4j-driver';

	import { trpc } from '$lib/trpc/client';
	import { page } from '$app/stores';

	export let chapterNode: ChapterNode;
	export let bookID: string;
	export let storylineID: string;
	export let prevChapterID: string;

	let customClass = '';
	export { customClass as class };

	let chapterProperties: ChapterProperties = chapterNode.properties;

	let closeModal = () => {
		modalStore.close();
	};

	async function submit() {
		if (chapterNode.properties.id) {
			updateChapter();
		} else {
			createChapter();
		}

		return false;
	}

	async function createChapter() {
		let toastMessage = 'Creation Failed';
		let toastBackground = 'bg-warning-500';

		trpc($page)
			.chapters.create.mutate({
				title: chapterProperties.title!,
				bookID: bookID,
				storylineID: storylineID,
				prevChapterID: prevChapterID ? prevChapterID : '',
				description: chapterProperties.description!
			})
			.then((chapterNodeResponse) => {
				chapterNode = chapterNodeResponse.chapter as ChapterNode;
				toastMessage = 'Sunccessfully Created';
				toastBackground = 'bg-success-500';

				if ($modalStore[0]) {
					$modalStore[0].response ? $modalStore[0].response(chapterNode) : '';
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

	async function updateChapter() {
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
	}
</script>

<form class={`modal-example-form card p-4 w-modal shadow-xl space-y-4 ${customClass}`}>
	<header class="text-2xl font-bold text-center">{chapterProperties.title}</header>
	<div class="modal-form border border-surface-500 p-4 space-y-4 rounded-container-token">
		<label>
			Chapter Title

			<input
				class="input"
				type="text"
				bind:value={chapterProperties.title}
				placeholder="Chapter Title"
				required
			/>
		</label>
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
