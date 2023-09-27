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
		modalStore
	} from '@skeletonlabs/skeleton';
	import type { ModalSettings, ModalComponent, DrawerSettings } from '@skeletonlabs/skeleton';
	import { onMount, beforeUpdate, afterUpdate } from 'svelte';
	import Quill from 'quill';
	import { QuillEditor } from '$lib/util/editor/quill';
	import type { PageData } from './$types';
	import type { HydratedDocument } from 'mongoose';

	import Icon from 'svelte-awesome';
	import {
		chevronLeft,
		chevronRight,
		infoCircle,
		stickyNote,
		dashcube
	} from 'svelte-awesome/icons';
	import { page } from '$app/stores';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import 'quill-comment';
	import type { ChapterProperties } from '$lib/properties/chapter';
	import ChapterNotesModal from '$lib/components/chapter/ChapterNotesModal.svelte';
	import BookHeader from '$lib/components/book/BookHeader.svelte';

	export let data: PageData;
	$: ({ session, userAuthoredBookResponse: bookData, storylineResponse, chapterResponses } = data);

	onMount(() => {
		toggleDrawer();
	});

	/**
	 * Set up selected chapter before the DOM is updated.
	 * The DOM will use that data to render elements
	 */
	beforeUpdate(() => {
		let chapterID = $page.url.searchParams.get('chapterID');

		// Set selectedChapterNode to be from the url parameter
		if (!selectedChapterNode) {
			if (!chapterID && Object.keys(chapterResponses).length !== 0) {
				chapterID = Object.keys(chapterResponses)[0];
			}

			if (chapterID && chapterID in chapterResponses) {
				selectedChapterNode = chapterResponses[chapterID];
			}

			leftDrawerList = selectedChapterNode?._id;
		}
	});

	/**
	 * Being USED after a chapter add
	 * We cannot update after return of modal result because the editor and the chapter node are out of sync
	 */
	afterUpdate(() => {
		if (!quill || !quill.chapter || quill.chapter._id !== selectedChapterNode._id) {
			setupEditor();
		}
	});

	/**
	 * Drawer settings
	 */
	const drawerSettings: DrawerSettings = {
		id: 'leftDrawer',
		bgDrawer: 'bg-transparent',
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

	let selectedChapterNode: HydratedDocument<ChapterProperties>;
	let leftDrawerList = 'copyright';

	function chapterSelected(chapter: HydratedDocument<ChapterProperties>) {
		selectedChapterNode = chapterResponses[chapter._id];
	}

	function bookSelected() {
		quill.chapter = undefined;
	}

	function storylineSelected() {
		quill.chapter = undefined;
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
		modalComponent.props = {
			chapterNode: selectedChapterNode,
			bookID: bookData._id,
			storylineID: storylineResponse._id
		};

		modalStore.trigger(modalSettings);
	};

	let showChapterNotes = () => {
		modalComponent.ref = ChapterNotesModal;
		modalComponent.props = { storylineNode: storylineResponse };
		modalStore.trigger(modalSettings);
	};

	/**
	 * Quill Editor Settings
	 */
	let quill: QuillEditor;
	let showComments: boolean = false;

	let toolbarOptions = [['comments-add', 'comments-toggle']];

	let commentBgColor = '';
	$: cssVarStyles = `--comment-bg-color:${commentBgColor}`;

	function toggleShowComments() {
		showComments = !showComments;

		if (showComments) {
			commentBgColor = 'var(--color-primary-500)';
		} else {
			commentBgColor = '';
		}
	}

	/**
	 * Finds the editor element and creates a new Quill instance from that
	 * It must only run after the page load and after the editor element was off the screen
	 */
	function setupEditor() {
		let icons = Quill.import('ui/icons');
		icons['comments-add'] = '<img src="/comments.svg"/>';

		let container = document.getElementById('editor');
		if (container) {
			container.innerHTML = '';
			quill = new QuillEditor(container, selectedChapterNode, $page, {
				reader: true,
				theme: 'bubble',
				modules: {
					toolbar: toolbarOptions,
					comment: {
						enabled: true,
						commentAuthorId: session?.user.id,
						commentAddOn: session?.user.email
					}
				},
				placeholder: 'Coming soon...'
			});
		}
	}
</script>

<svelte:head>
	<link rel="stylesheet" type="text/css" href="//cdn.quilljs.com/1.3.6/quill.bubble.css" />
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<AppShell class="editor-shell">
	<svelte:fragment slot="sidebarLeft">
		<Drawer
			regionBackdrop="w-2/4 md:w-full !bg-transparent"
			width="w-[180px] md:w-[280px]"
			position="left"
			class="md:!relative h-full "
		>
			<div class="p-4 flex flex-col items-center bg-surface-50-900-token h-full">
				<Accordion>
					<AccordionItem open>
						<svelte:fragment slot="summary">
							<p class="text-lg font-bold">Book</p>
						</svelte:fragment>
						<svelte:fragment slot="content">
							<ListBox>
								<ListBoxItem
									on:change={() => bookSelected()}
									bind:group={leftDrawerList}
									name="medium"
									class="soft-listbox"
									value="book"
								>
									{bookData.title}
								</ListBoxItem>
							</ListBox>
						</svelte:fragment>
					</AccordionItem>
					<AccordionItem open>
						<svelte:fragment slot="summary">
							<p class="text-lg font-bold">Storylines</p>
						</svelte:fragment>
						<svelte:fragment slot="content">
							<ListBox>
								<ListBoxItem
									on:change={() => storylineSelected()}
									bind:group={leftDrawerList}
									name="medium"
									class="soft-listbox"
									value="storyline"
								>
									{storylineResponse.title}
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
										on:change={() => chapterSelected(chapterResponse)}
										bind:group={leftDrawerList}
										name="chapter"
										class="soft-listbox"
										value={chapterResponse._id}
									>
										<p class="line-clamp-1">{chapterResponse.title}</p>
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
			width="max-w-[80px]"
			position="right"
			class="md:!relative h-full !left-auto"
		>
			<div class="flex h-full">
				{#if showComments && Object.keys(quill.comments).length !== 0}
					<div
						id="comments-container"
						class="w-[200px] right-24 fixed h-full p-2 flex flex-col items-center space-y-2 overflow-y-scroll"
					>
						{#each Object.entries(quill.comments) as [id, comment]}
							<div
								class="card w-full p-1 shadow-xl scale-95 focus-within:scale-100 hover:scale-100"
							>
								<textarea
									id={comment.id}
									class="textarea text-sm h-20 resize-none overflow-hidden"
									bind:value={quill.comments[id].comment}
									required
									disabled
								/>
							</div>
						{/each}
					</div>
				{/if}
				<div class="flex flex-col p-2 bg-surface-50-900-token">
					<div class="h-3/4 flex flex-col items-center">
						<LightSwitch />
						{#if selectedChapterNode}
							<button
								on:click={() => showChapterDetails()}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token"
							>
								<Icon class="p-2" data={infoCircle} scale={2.5} />
							</button>
							<button
								on:click={() => toggleShowComments()}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token"
							>
								<Icon class="p-2" data={dashcube} scale={2.5} />
							</button>
							<button
								on:click={() => showChapterNotes()}
								type="button"
								class="m-2 btn-icon bg-surface-200-700-token"
							>
								<Icon class="p-2" data={stickyNote} scale={2.5} />
							</button>
						{/if}
					</div>
				</div>
			</div>
		</Drawer>
	</svelte:fragment>
	<svelte:fragment slot="default">
		<div class="flex h-full w-full">
			{#if leftDrawerList === 'book'}
				<div class="mx-2 my-4 md:mx-8 xl:mx-32">
					<BookHeader {bookData} storylineData={storylineResponse} />
				</div>
			{:else if leftDrawerList === 'storyline'}
				<div class="mx-2 my-4 md:mx-8 xl:mx-32">
					<BookHeader {bookData} storylineData={storylineResponse} />
				</div>
			{:else if selectedChapterNode}
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
						class="block p-2.5 resize-none w-full text-center text-2xl md:text-4xl bg-transparent border-transparent focus:border-transparent focus:ring-0"
						placeholder="Chapter Title"
						bind:value={selectedChapterNode.title}
						disabled
					/>
					<div class="w-full md:w-3/4" id="editor" style={cssVarStyles} />
				</div>
				<div on:click={toggleDrawer} class="flex h-full items-center hover:variant-soft">
					{#if $drawerStore.open}
						<Icon class="flex p-2 justify-start" data={chevronRight} scale={3} />
					{:else}
						<Icon class="flex p-2 justify-start" data={chevronLeft} scale={3} />
					{/if}
				</div>
			{/if}
		</div>
	</svelte:fragment>
</AppShell>
