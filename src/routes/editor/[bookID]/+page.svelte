<script lang="ts">
	import {
		AppShell,
		Drawer,
		drawerStore,
		Accordion,
		AccordionItem,
		ListBoxItem,
		ListBox
	} from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { onMount, beforeUpdate } from 'svelte';
	import Quill from 'quill';
	import type { DrawerSettings } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';

	import Icon from 'svelte-awesome';
	import { chevronLeft, chevronRight, edit } from 'svelte-awesome/icons';
	import type { ChapterNode } from '$lib/nodes/digital-products/chapter';

	let quill = null;

	export let data: PageData;
	$: ({ userAuthoredBookResponse: bookData, storylineResponse, chapters } = data);

	// Drawer settings
	const drawerSettings: DrawerSettings = {
		id: 'leftDrawer',
		bgDrawer: 'bg-surface-100-800-token',
		height: 'h-full',
		padding: 'p-4',
		rounded: 'rounded-xl'
	};

	function toggleDrawer() {
		if ($drawerStore.open) {
			drawerStore.close();
		} else {
			drawerStore.open(drawerSettings);
		}
	}

	let selectedChapterID: string;
	let leftDrawerList = '';

	function drawerItemSelected(chapter?: ChapterNode) {
		if (chapter) {
			selectedChapterID = chapter.properties.id;
		}
	}

	// Quill editor settings
	let toolbarOptions = [
		['bold', 'italic', 'underline', 'strike'],
		['blockquote', { indent: '+1' }],
		[{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }]
	];

	beforeUpdate(() => {
		if (!selectedChapterID) {
			selectedChapterID = Object.keys(chapters)[0];
		}
	});

	onMount(() => {
		let container = document.getElementById('editor');
		if (container) {
			quill = new Quill(container, {
				theme: 'bubble',
				modules: {
					toolbar: toolbarOptions
				},
				placeholder: 'Let your voice be heard...'
			});
		}
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="//cdn.quilljs.com/1.3.6/quill.bubble.css" />
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<AppShell class="editor-shell">
	<svelte:fragment slot="sidebarLeft">
		<Drawer width="w-[180px] md:w-[280px]" position="left" class="md:!relative h-full">
			<div class="p-4 flex flex-col items-center">
				<Accordion>
					<AccordionItem open>
						<svelte:fragment slot="summary">
							<p class="text-lg font-bold">Front Matter</p>
						</svelte:fragment>
						<svelte:fragment slot="content">
							<ListBox>
								<ListBoxItem
									on:change={() => drawerItemSelected()}
									bind:group={leftDrawerList}
									name="medium"
									value="copyright"
								>
									Copyright
								</ListBoxItem>
							</ListBox>
						</svelte:fragment>
					</AccordionItem>
					<AccordionItem>
						<svelte:fragment slot="summary">
							<p class="text-lg font-bold">Chapters</p>
						</svelte:fragment>
						<svelte:fragment slot="content">
							<ListBox>
								{#each Object.entries(chapters) as [id, chapter]}
									<ListBoxItem
										on:change={() => drawerItemSelected(chapter)}
										bind:group={leftDrawerList}
										name="chapter"
										value={chapter.properties.id}
									>
										<p class="line-clamp-1">{chapter.properties.title}</p>
									</ListBoxItem>
								{/each}
							</ListBox>
						</svelte:fragment>
					</AccordionItem>
					<!-- ... -->
				</Accordion>
			</div>
		</Drawer>
	</svelte:fragment>
	<svelte:fragment slot="sidebarRight">
		<Drawer width="w-[60px] md:w-[120px]" position="right" class="md:!relative h-full">
			<div class="p-4 flex flex-col items-center"><LightSwitch /></div>
		</Drawer>
	</svelte:fragment>
	<svelte:fragment slot="default">
		<div class="flex h-full w-full">
			<div on:click={toggleDrawer} class="flex h-full items-center hover:variant-soft">
				{#if $drawerStore.open}
					<Icon class="flex p-2 justify-start" data={chevronLeft} scale={3} />
				{:else}
					<Icon class="flex p-2 justify-start" data={chevronRight} scale={3} />
				{/if}
			</div>
			<div class="editor-container py-10 flex flex-col w-full items-center">
				<textarea
					id="message"
					rows="4"
					class="block p-2.5 resize-none w-full text-center text-4xl bg-transparent border-transparent focus:border-transparent focus:ring-0"
					placeholder="Chapter Title"
					bind:value={chapters[selectedChapterID].properties.title}
				/>
				<div class="w-3/4" id="editor" />
			</div>
			<div on:click={toggleDrawer} class="flex h-full items-center hover:variant-soft">
				{#if $drawerStore.open}
					<Icon class="flex p-2 justify-start" data={chevronRight} scale={3} />
				{:else}
					<Icon class="flex p-2 justify-start" data={chevronLeft} scale={3} />
				{/if}
			</div>
		</div>
	</svelte:fragment>
</AppShell>

<style>
</style>
