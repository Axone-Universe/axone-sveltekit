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
	import type { PageData } from './$types';

	import Icon from 'svelte-awesome';
	import {
		chevronLeft,
		chevronRight,
		refresh,
		check,
		trash,
		edit,
		user,
		home
	} from 'svelte-awesome/icons';
	import type { ChapterNode } from '$lib/nodes/digital-products/chapter';
	import type { DeltaNode, DeltaResponse } from '$lib/nodes/digital-assets/delta';
	import { page } from '$app/stores';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import type { DeltaQuery } from '$lib/util/types';

	export let data: PageData;
	$: ({ userAuthoredBookResponse: bookData, storylineResponse, chapterResponses } = data);

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
			setupEditor();
		}
	}

	let modalComponent: ModalComponent = {
		ref: undefined
	};

	let modalSettings: ModalSettings = {
		type: 'component',
		// Pass the component directly:
		component: modalComponent
	};

	let showChapterDetails = () => {
		modalComponent.ref = ChapterDetailsModal;
		modalComponent.props = { chapterNode: chapterResponses[selectedChapterID].chapter };
		modalStore.trigger(modalSettings);
	};

	/**
	 * Quill Editor Settings
	 */
	let autosaveInterval = 5000;
	let isEditor: boolean = true;
	let isChapterDetails: boolean = false;
	let quill: Quill;

	let toolbarOptions = [
		['bold', 'italic', 'underline', 'strike'],
		['blockquote', { indent: '+1' }],
		[{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }]
	];

	beforeUpdate(() => {
		let chapterID = $page.url.searchParams.get('chapterID');
		// Set selectedChapterID to be from the url parameter
		if (!selectedChapterID) {
			if (chapterID) {
				selectedChapterID = chapterResponses[chapterID].chapter.properties.id;
			} else {
				selectedChapterID = Object.keys(chapterResponses)[0];
			}
			leftDrawerList = selectedChapterID;
		}
	});

	// afterUpdate(() => {
	// 	setupEditor();
	// });

	onMount(() => {
		setupEditor();
		toggleDrawer();
	});

	function loadChapterDelta() {
		let deltaID = chapterResponses[selectedChapterID].chapter.properties.deltaID;

		quill.disable();
		quill.setText('Loading...');

		let trpcRequest;
		if (deltaID) {
			trpcRequest = trpc($page).deltas.getById.query({
				id: deltaID
			});
		} else {
			trpcRequest = trpc($page).deltas.create.mutate({
				chapterID: selectedChapterID
			});
		}

		trpcRequest.then((deltaResponse) => {
			chapterResponses[selectedChapterID].delta = deltaResponse.delta as DeltaNode;
			chapterResponses[selectedChapterID].chapter.properties.deltaID =
				deltaResponse.delta.properties.id;

			let opsJSON = deltaResponse.delta.properties.ops;
			let ops = JSON.parse(opsJSON ? opsJSON : '[]');

			quill.setContents(new Delta(ops));
			quill.enable();

			quill.on('text-change', updateChapterChange);
		});
	}
	/**
	 * Finds the editor element and creates a new Quill instance from that
	 * It must only run after the page load and after the editor element was off the screen
	 */
	let runSetupEditor: boolean = true;
	function setupEditor() {
		// if (!runSetupEditor) {
		// 	return;
		// }

		changeDelta = new Delta();

		let container = document.getElementById('editor');
		if (container) {
			quill = new Quill(container, {
				theme: 'bubble',
				modules: {
					toolbar: toolbarOptions,
					history: {
						delay: 1000,
						maxStack: 500,
						userOnly: true
					}
				},
				placeholder: 'Let your voice be heard...'
			});

			loadChapterDelta();
		}
		// runSetupEditor = false;
	}

	/**
	 * Checks whether the history has changed and updates the chapter deltas
	 * 1. Double maxStack when its about to fill up
	 * 2. Update the chapter's deltas to be the history stack's one
	 */

	var changeDelta = new Delta();
	var changeDeltaSnapshot: Delta;

	function updateChapterChange(delta: Delta) {
		changeDelta = changeDelta.compose(delta);
	}

	// Save the changes periodically
	setInterval(async function () {
		if (changeDelta.length() > 0) {
			let deltaID = chapterResponses[selectedChapterID].chapter.properties.deltaID;
			if (!deltaID) {
				return;
			}

			// take a snapshot of current delta state.
			// that is the one sent to the server
			changeDeltaSnapshot = new Delta(changeDelta.ops);
			changeDelta = new Delta();

			// TODO: If the autosave fails, merge snapshot and change deltas
			trpc($page)
				.deltas.update.mutate({
					id: deltaID,
					chapterID: selectedChapterID,
					ops: JSON.stringify(changeDeltaSnapshot.ops)
				})
				.then((chapterNodeResponse) => {
					// Update the content to be one delta
					updateChapterContent();
				});
		}
	}, autosaveInterval);

	function updateChapterContent() {
		let deltaProperties = chapterResponses[selectedChapterID].delta?.properties;
		let chapterContentDelta: Delta = new Delta();

		if (!deltaProperties) {
			return;
		}

		let ops = JSON.parse(deltaProperties.ops);
		chapterContentDelta = new Delta(ops);

		// now update the content
		let composedDelta = chapterContentDelta.compose(changeDelta);
		deltaProperties.ops = JSON.stringify(composedDelta.ops);
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="//cdn.quilljs.com/1.3.6/quill.bubble.css" />
</svelte:head>

<!-- <Modal chapterNode={chapters[selectedChapterID]} /> -->

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
								{#each Object.entries(chapterResponses) as [id, chapterResponse]}
									<ListBoxItem
										on:change={() => drawerItemSelected(chapterResponse.chapter)}
										bind:group={leftDrawerList}
										name="chapter"
										value={chapterResponse.chapter.properties.id}
									>
										<p class="line-clamp-1">{chapterResponse.chapter.properties.title}</p>
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
			<div class="h-3/4 p-4 flex flex-col items-center">
				<LightSwitch />
				<button
					on:click={() => showChapterDetails()}
					type="button"
					class="m-2 btn-icon bg-surface-200-700-token"
				>
					<Icon class="p-2" data={edit} scale={2.5} />
				</button>

				<button type="button" class="m-2 btn-icon bg-surface-200-700-token">
					<Icon class="p-2" data={user} scale={2.5} />
				</button>
				<button type="button" class="m-2 btn-icon bg-surface-200-700-token">
					<Icon class="p-2" data={home} scale={2.5} />
				</button>
			</div>
			<div class="h-1/4 p-4 flex flex-col-reverse items-center">
				{#if changeDelta.length() > 0}
					<button type="button" class="m-2 btn-icon bg-surface-200-700-token">
						<Icon class="p-2" data={refresh} scale={2.5} />
					</button>
				{:else}
					<button type="button" class="m-2 btn-icon bg-success-300-600-token">
						<Icon class="p-2" data={check} scale={2.5} />
					</button>
				{/if}
				<button type="button" class="m-2 btn-icon bg-surface-200-700-token">
					<Icon class="p-2" data={trash} scale={2.5} />
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
						bind:value={chapterResponses[selectedChapterID].chapter.properties.title}
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
							bind:value={chapterResponses[selectedChapterID].chapter.properties.title}
						/>
						<!-- {#if firstNameError}<p class="text-error-500">First name is required.</p>{/if} -->
					</label>

					<label>
						Chapter Description
						<textarea
							class="textarea h-44 overflow-hidden"
							bind:value={chapterResponses[selectedChapterID].chapter.properties.description}
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
