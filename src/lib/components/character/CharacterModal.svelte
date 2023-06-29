<script lang="ts">
	import {
		AppShell,
		Drawer,
		drawerStore,
		Accordion,
		AccordionItem,
		ListBoxItem,
		ListBox,
		LightSwitch,
		modalStore,
		Modal
	} from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent, DrawerSettings } from '@skeletonlabs/skeleton';

	import { onMount, beforeUpdate, afterUpdate } from 'svelte';
	import { trpc } from '$lib/trpc/client';
	import Quill from 'quill';
	import Delta from 'quill-delta';

	import Icon from 'svelte-awesome';
	import { chevronLeft } from 'svelte-awesome/icons';
	import { page } from '$app/stores';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import type { DeltaQuery } from '$lib/util/types';
	import type { StorylineNode } from '$lib/nodes/digital-products/storyline';

	export let storylineNode: StorylineNode;

	let customClass = '';
	export { customClass as class };

	let characterDrawerList = 'copyright';
</script>

<svelte:head>
	<link rel="stylesheet" href="//cdn.quilljs.com/1.3.6/quill.bubble.css" />
</svelte:head>

<!-- <Modal chapterNode={chapters[selectedChapterID]} /> -->

<!-- svelte-ignore a11y-click-events-have-key-events -->
<form class={`modal-example-form card p-4 w-modal shadow-xl space-y-4 ${customClass}`}>
	<!-- <svelte:fragment slot="sidebarLeft"> -->
	<div class="p-4 flex flex-col items-center">
		<Accordion>
			<AccordionItem open>
				<svelte:fragment slot="summary">
					<p class="text-lg font-bold">Storyline</p>
				</svelte:fragment>
				<svelte:fragment slot="content">
					<ListBox>
						<ListBoxItem bind:group={characterDrawerList} name="medium" value="copyright">
							Harry Potter
						</ListBoxItem>
					</ListBox>
				</svelte:fragment>
			</AccordionItem>
			<!-- ... -->
		</Accordion>
	</div>
	<!-- </svelte:fragment> -->
</form>
