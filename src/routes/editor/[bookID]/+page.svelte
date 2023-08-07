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
	import { trpc } from '$lib/trpc/client';
	import Quill from 'quill';
	import { QuillEditor } from '$lib/util/editor/quill';
	import type { PageData } from './$types';
	import type { HydratedDocument } from 'mongoose';

	import Icon from 'svelte-awesome';
	import {
		chevronLeft,
		chevronRight,
		plus,
		spinner,
		check,
		trash,
		edit,
		stickyNote,
		dashcube
	} from 'svelte-awesome/icons';
	import { page } from '$app/stores';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import ChapterNotesModal from '$lib/components/chapter/ChapterNotesModal.svelte';
	import 'quill-comment';
	import { ChapterPropertyBuilder, type ChapterProperties } from '$lib/shared/chapter';
	import { changeDelta } from '$lib/util/editor/quill';
	import BookHeader from '$lib/components/book/BookHeader.svelte';
	import { onDestroy } from 'svelte';

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
	 * To avoid memory leaks clear the interval
	 */
	onDestroy(() => clearInterval(saveDeltaInterval));

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
		component: modalComponent,
		response: (chapterNode: HydratedDocument<ChapterProperties>) => {
			if (!chapterNode) {
				return;
			}

			// Update the UI
			let chapterID = chapterNode._id;
			leftDrawerList = chapterID;

			// afterUpdate() will run the setup editor
			chapterResponses[chapterID] = chapterNode;

			selectedChapterNode = chapterNode;
			chapterResponses = chapterResponses;
		}
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

	let createChapter = () => {
		let chapterProperties = new ChapterPropertyBuilder().getProperties();
		let newChapterNode: HydratedDocument<ChapterProperties> =
			chapterProperties as HydratedDocument<ChapterProperties>;

		let prevChapterID = '';

		// Object (dictionary) keys are ordered largely by when the key was added
		if (Object.keys(chapterResponses).length !== 0) {
			prevChapterID = Object.keys(chapterResponses).pop()!;
		}

		modalComponent.ref = ChapterDetailsModal;
		modalComponent.props = {
			chapterNode: newChapterNode,
			bookID: bookData._id,
			storylineID: storylineResponse._id,
			prevChapterID: prevChapterID
		};

		modalStore.trigger(modalSettings);
	};

	let deleteChapter = () => {
		const modal: ModalSettings = {
			type: 'confirm',
			// Data
			title: selectedChapterNode.title,
			body: 'Are you sure you wish to delete this chapter?',
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r) {
					trpc($page)
						.chapters.delete.mutate({
							id: selectedChapterNode._id
						})
						.then((response) => {
							if (response.deletedCount !== 0) {
								let deletedID = selectedChapterNode._id;
								let chapterIDs = Object.keys(chapterResponses);
								let nextIndex = chapterIDs.indexOf(deletedID) + 1;

								if (nextIndex >= chapterIDs.length) {
									nextIndex = 0;
								}

								let selectedChapterID = chapterIDs[nextIndex];
								leftDrawerList = selectedChapterID;

								// delete the node first
								delete chapterResponses[deletedID];

								// give next node if it's available
								selectedChapterNode = chapterResponses[selectedChapterID];

								chapterResponses = chapterResponses;

								// setup the editor
								setupEditor();
							}
						})
						.catch((error) => {
							console.log(error);
						});
				}
			}
		};
		modalStore.trigger(modal);
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
	let deltaChange;

	// Subscribe to the quill changeDelta to see if delta has changed
	changeDelta.subscribe((value) => {
		deltaChange = value;
		quill.comments = quill.comments;
	});

	let toolbarOptions = [
		['bold', 'italic', 'underline', 'strike'],
		['blockquote', { indent: '+1' }],
		[
			{ align: '' },
			{ align: 'center' },
			{ align: 'right' },
			{ align: 'justify' },
			'comments-add',
			'comments-toggle'
		]
	];

	$: commentBgColor = showComments ? 'var(--color-primary-500)' : '';
	$: cssVarStyles = `--comment-bg-color:${commentBgColor}`;

	function toggleShowComments() {
		showComments = !showComments;
	}

	function removeComment(id: string) {
		let editor = document.getElementById('editor');
		quill.removeComment(id, editor);
	}

	/**
	 * Updates existing comment by getting the blot from the quill Parchment
	 * It then finds the range of the comment and updates the comment attribute values
	 * @param id
	 */
	function submitComment(id: string) {
		const comment = quill.comments[id].comment;
		let editor = document.getElementById('editor');
		quill.updateComment(id, editor, comment);
	}

	function commentAddClick() {
		quill.getModule('comment').addComment(' ');
		drawerStore.open(drawerSettings);
		showComments = true;
	}

	function commentServerTimestamp() {
		// call from server or local time. But must return promise with UNIX Epoch timestamp resolved (like 1507617041)
		return new Promise((resolve, reject) => {
			let currentTimestamp = Math.round(new Date().getTime() / 1000);

			resolve(currentTimestamp);
		});
	}

	/**
	 * Finds the editor element and creates a new Quill instance from that
	 * It must only run after the page load and after the editor element was off the screen
	 */
	let saveDeltaInterval: string | number | NodeJS.Timeout | undefined;
	function setupEditor() {
		let icons = Quill.import('ui/icons');
		icons['comments-add'] = '<img src="/comments.svg"/>';

		let container = document.getElementById('editor');
		if (container) {
			container.innerHTML = '';
			quill = new QuillEditor(container, selectedChapterNode, $page, {
				reader: false,
				theme: 'bubble',
				modules: {
					toolbar: toolbarOptions,
					comment: {
						enabled: true,
						commentAuthorId: session?.user.id,
						commentAddOn: session?.user.email, // any additional info needed
						commentAddClick: commentAddClick, // get called when `ADD COMMENT` btn on options bar is clicked
						commentTimestamp: commentServerTimestamp
					},
					history: {
						delay: 1000,
						maxStack: 500
					}
				},
				placeholder: 'Let your voice be heard...'
			});

			clearInterval(saveDeltaInterval);
			saveDeltaInterval = setInterval(quill.saveDelta.bind(quill), 2000);
		}
	}
</script>

<svelte:head>
	<link rel="stylesheet" type="text/css" href="//cdn.quilljs.com/1.3.6/quill.bubble.css" />
</svelte:head>

<!-- <Modal chapterNode={chapters[selectedChapterID]} /> -->

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
								/>
								<footer class="modal-footer flex flex-col space-x-2 items-center">
									<div>
										<button on:click={() => removeComment(id)} class="chip variant-ghost-surface">
											Resolve
										</button>
										<button
											on:click={() => submitComment(id)}
											class="chip variant-filled"
											type="submit"
										>
											Save
										</button>
									</div>
								</footer>
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
								<Icon class="p-2" data={edit} scale={2.5} />
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
					<div class="h-1/4 flex flex-col-reverse items-center">
						{#if deltaChange.length() > 0}
							<button type="button" class="m-2 btn-icon bg-surface-200-700-token">
								<Icon class="p-2" data={spinner} scale={2.5} pulse />
							</button>
						{:else}
							<button type="button" class="m-2 btn-icon bg-success-300-600-token">
								<Icon class="p-2" data={check} scale={2.5} />
							</button>
						{/if}
						<button
							on:click={() => deleteChapter()}
							type="button"
							class="m-2 btn-icon bg-surface-200-700-token"
						>
							<Icon class="p-2" data={trash} scale={2.5} />
						</button>
						<button
							on:click={() => createChapter()}
							type="button"
							class="m-2 btn-icon bg-surface-200-700-token"
						>
							<Icon class="p-2" data={plus} scale={2.5} />
						</button>
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
