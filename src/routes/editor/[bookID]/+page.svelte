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
	import { onMount, beforeUpdate, afterUpdate } from 'svelte';
	import { trpc } from '$lib/trpc/client';
	import Quill from 'quill';
	import Delta from 'quill-delta';

	import type { DrawerSettings } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';

	import Icon from 'svelte-awesome';
	import {
		chevronLeft,
		chevronRight,
		save,
		trash,
		edit,
		pencil,
		user,
		home,
		undo
	} from 'svelte-awesome/icons';
	import type { ChapterNode } from '$lib/nodes/digital-products/chapter';
	import { page } from '$app/stores';

	export let data: PageData;
	$: ({ userAuthoredBookResponse: bookData, storylineResponse, chapters } = data);

	/**
	 * Drawer settings
	 */
	const drawerSettings: DrawerSettings = {
		id: 'leftDrawer',
		bgDrawer: 'bg-surface-50-900-token',
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
	let leftDrawerList = 'copyright';

	function drawerItemSelected(chapter?: ChapterNode) {
		if (chapter) {
			selectedChapterID = chapter.properties.id;
		}
	}

	/**
	 * Quill Editor Settings
	 */
	let autosaveInterval = 2000;
	let isEditor: boolean = true;
	let isChapterDetails: boolean = false;
	let quill: Quill;
	let chapterID = $page.url.searchParams.get('chapterID');

	function showChapterDetails() {
		isChapterDetails = true;
		isEditor = false;
	}

	function showEditor() {
		isEditor = true;
		isChapterDetails = false;
		runSetupEditor = true;
	}

	let toolbarOptions = [
		['bold', 'italic', 'underline', 'strike'],
		['blockquote', { indent: '+1' }],
		[{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }]
	];

	beforeUpdate(() => {
		if (!selectedChapterID) {
			if (chapterID) {
				selectedChapterID = chapters[chapterID].properties.id;
			} else {
				selectedChapterID = Object.keys(chapters)[0];
			}
			leftDrawerList = selectedChapterID;
		}
	});

	afterUpdate(() => {
		setupEditor();
	});

	onMount(() => {
		toggleDrawer();
	});

	/**
	 * Takes the currently selected chapter node and saves it
	 * Takes the current editor input and also saves it on the chapter node
	 */
	let text = '';
	let contents: Delta;

	/**
	 * Finds the editor element and creates a new Quill instance from that
	 * It must only run after the page load and after the editor element was off the screen
	 */
	let runSetupEditor: boolean = true;
	let maxStack = 500;
	function setupEditor() {
		if (!runSetupEditor) {
			return;
		}

		changeDelta = new Delta();

		let container = document.getElementById('editor');
		if (container) {
			quill = new Quill(container, {
				theme: 'bubble',
				modules: {
					toolbar: toolbarOptions,
					history: {
						delay: 1000,
						maxStack: maxStack,
						userOnly: true
					}
				},
				placeholder: 'Let your voice be heard...'
			});
			quill.on('text-change', updateChapterChange);

			let chapterProperties = chapters[selectedChapterID].properties;
			if (chapterProperties.content) {
				let ops = JSON.parse(chapterProperties.content);
				quill.setContents(new Delta(ops));
			}
		}
		runSetupEditor = false;
	}

	function undoEditor() {
		console.log(document.getSelection());
		document.getSelection()?.removeAllRanges();
		// quill.getModule('history').undo();
	}

	/**
	 * Checks whether the history has changed and updates the chapter deltas
	 * 1. Double maxStack when its about to fill up
	 * 2. Update the chapter's deltas to be the history stack's one
	 */

	var changeDelta = new Delta();
	function updateChapterChange(delta: Delta) {
		changeDelta = changeDelta.compose(delta);
	}

	// Save the changes periodically
	setInterval(function () {
		if (changeDelta.length() > 0) {
			// console.log('Saving changes', change);

			// TODO: send changes to server which will merge into content string
			// await trpc($page).chapters.autosave.mutate(change);

			// Update the content to be one delta
			updateChapterContent();
			changeDelta = new Delta();
		}
	}, autosaveInterval);

	function updateChapterContent() {
		let chapterProperties = chapters[selectedChapterID].properties;
		let chapterContentDelta: Delta = new Delta();

		if (chapterProperties.content) {
			let ops = JSON.parse(chapterProperties.content);
			chapterContentDelta = new Delta(ops);
		}

		// now update the content
		let composedDelta = chapterContentDelta.compose(changeDelta);
		chapters[selectedChapterID].properties.content = JSON.stringify(composedDelta.ops);
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="//cdn.quilljs.com/1.3.6/quill.bubble.css" />
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<AppShell class="editor-shell">
	<svelte:fragment slot="sidebarLeft">
		<Drawer
			regionBackdrop="w-2/4 md:w-full !bg-transparent"
			width="w-[180px] md:w-[280px]"
			position="left"
			class="md:!relative h-full"
		>
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
					<AccordionItem open>
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
		<Drawer
			regionBackdrop="w-2/4 md:w-full !bg-transparent"
			width="w-[60px] md:w-[80px]"
			position="right"
			class="md:!relative h-full !left-auto"
		>
			<div class="p-4 flex flex-col items-center">
				<LightSwitch />
				<button
					on:click={() => showChapterDetails()}
					type="button"
					class="m-2 btn-icon bg-surface-200-700-token"
				>
					<Icon class="p-2" data={edit} scale={2.5} />
				</button>
				<button
					on:click={() => showEditor()}
					type="button"
					class="m-2 btn-icon bg-surface-200-700-token"
				>
					<Icon class="p-2" data={pencil} scale={2.5} />
				</button>
				<button
					on:click={() => undoEditor()}
					type="button"
					class="m-2 btn-icon bg-surface-200-700-token"
				>
					<Icon class="p-2" data={undo} scale={2.5} />
				</button>
				<button type="button" class="m-2 btn-icon bg-surface-200-700-token">
					<Icon class="p-2" data={trash} scale={2.5} />
				</button>
				<button type="button" class="m-2 btn-icon bg-surface-200-700-token">
					<Icon class="p-2" data={user} scale={2.5} />
				</button>
				<button type="button" class="m-2 btn-icon bg-surface-200-700-token">
					<Icon class="p-2" data={home} scale={2.5} />
				</button>
			</div>
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
			{#if isEditor}
				<div class="editor-container py-10 flex flex-col w-full items-center">
					<textarea
						id="message"
						rows="4"
						class="block p-2.5 resize-none w-full text-center text-2xl md:text-4xl bg-transparent border-transparent focus:border-transparent focus:ring-0"
						placeholder="Chapter Title"
						bind:value={chapters[selectedChapterID].properties.title}
					/>
					<div class="w-full md:w-3/4" id="editor" />
				</div>
			{/if}
			{#if isChapterDetails}
				<div class="w-full p-10 space-y-10 chapter-details-container">
					<label>
						*Chapter Title
						<input
							class="input"
							type="text"
							bind:value={chapters[selectedChapterID].properties.title}
						/>
						<!-- {#if firstNameError}<p class="text-error-500">First name is required.</p>{/if} -->
					</label>

					<label>
						Chapter Description
						<textarea
							class="textarea h-44 overflow-hidden"
							bind:value={chapters[selectedChapterID].properties.description}
						/>
					</label>
				</div>
			{/if}
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
