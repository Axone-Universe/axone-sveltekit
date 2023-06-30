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
	import Delta from 'quill-delta';
	import { CommentsDelta } from '$lib/util/editor/delta';
	import type Op from 'quill-delta/dist/Op';
	import type { PageData } from './$types';

	import Icon from 'svelte-awesome';
	import {
		chevronLeft,
		chevronRight,
		refresh,
		check,
		trash,
		edit,
		stickyNote,
		dashcube
	} from 'svelte-awesome/icons';
	import type { ChapterNode } from '$lib/nodes/digital-products/chapter';
	import type { DeltaNode, DeltaResponse } from '$lib/nodes/digital-assets/delta';
	import { page } from '$app/stores';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import CharacterModal from '$lib/components/character/CharacterModal.svelte';
	import type { DeltaQuery } from '$lib/util/types';
	import 'quill-comment';

	export let data: PageData;
	$: ({ userAuthoredBookResponse: bookData, storylineResponse, chapterResponses } = data);

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

	let showCharacterDetails = () => {
		modalComponent.ref = CharacterModal;
		modalComponent.props = { storylineNode: storylineResponse.storyline };
		modalStore.trigger(modalSettings);
	};

	/**
	 * Quill Editor Settings
	 */
	let autosaveInterval = 5000;
	let isEditor: boolean = true;
	let isChapterDetails: boolean = false;
	let quill: Quill;
	let commentsDelta: CommentsDelta = new CommentsDelta();
	let showComments: boolean = true;

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

	onMount(() => {
		setupEditor();
		toggleDrawer();
	});

	/**
	 * Loads the delta of the selected chapter from the server
	 */
	function loadChapterDelta() {
		let deltaID = chapterResponses[selectedChapterID].chapter.properties.deltaID;

		quill.disable();

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

			quill.on('selection-change', selectionChange);
			quill.on('text-change', updateChapterChange);
			commentsDelta = new CommentsDelta(ops);

			quill.enable();
		});
	}

	function toggleShowComments() {
		showComments = !showComments;
	}

	function removeComment(id: string) {
		let [index, length] = getRangeByID(id);
		commentsDelta.removeComment(id, index, length, quill);
		commentsDelta.comments = commentsDelta.comments;
	}

	/**
	 * Updates existing comment by getting the blot from the quill Parchment
	 * It then finds the range of the comment and updates the comment attribute values
	 * @param id
	 */
	function submitComment(id: string) {
		const comment = commentsDelta.comments[id].comment;

		let [index, length] = getRangeByID(id);

		commentsDelta.updateComment(index, length, quill, comment);
	}

	/**
	 * Gets the range of the element with specified ID from the editor
	 * @param id
	 */
	function getRangeByID(id: string): [number | null, number | null] {
		// get the container with all the comments
		let editor = document.getElementById('editor');

		let commentSpan = editor?.querySelector(('#' + id).toString());

		if (!commentSpan) {
			return [null, null];
		}

		const blot = Quill.find(commentSpan);
		let index = blot.offset(quill.scroll);
		let length = blot.length();

		return [index, length];
	}

	// TODO: show comment input for new comment
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
	function setupEditor() {
		changeDelta = new Delta();

		let icons = Quill.import('ui/icons');
		icons['comments-add'] = '<img src="/comments.svg"/>';

		let container = document.getElementById('editor');
		if (container) {
			quill = new Quill(container, {
				theme: 'bubble',
				modules: {
					toolbar: toolbarOptions,
					comment: {
						enabled: true,
						commentAuthorId: 123,
						commentAddOn: 'Author Name', // any additional info needed
						commentAddClick: commentAddClick, // get called when `ADD COMMENT` btn on options bar is clicked
						commentTimestamp: commentServerTimestamp
					},
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
		// check if new comment was added
		let added = commentsDelta.delta(delta);
		if (added) {
			commentsDelta.comments = commentsDelta.comments;
		}
	}

	function selectionChange(
		range: { index: number; length: number },
		oldRange: { index: number; length: number },
		source: String
	) {
		if (!range) {
			return;
		}

		let delta = quill.getContents(range.index, 1);

		if (!commentsDelta.isComment(delta.ops[0])) {
			return;
		}

		let commentId = delta.ops[0].attributes?.commentId;

		if (!(commentId in commentsDelta.comments)) {
			return;
		}

		// get the container with all the comments
		let comments = document.getElementById('comments-container');

		// focus on the textarea. it has the id of the comment
		(comments?.querySelector(('#' + commentId).toString()) as HTMLElement).focus();
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
							<p class="text-lg font-bold">Storyline</p>
						</svelte:fragment>
						<svelte:fragment slot="content">
							<ListBox>
								<ListBoxItem
									on:change={() => drawerItemSelected()}
									bind:group={leftDrawerList}
									name="medium"
									value="copyright"
								>
									{storylineResponse.storyline.properties.title}
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
			width="max-w-[80px]"
			position="right"
			class="md:!relative h-full !left-auto"
		>
			<div class="flex h-full">
				{#if showComments && Object.keys(commentsDelta.comments).length !== 0}
					<div
						id="comments-container"
						class="w-[200px] right-24 fixed h-full p-2 flex flex-col items-center space-y-2 overflow-y-scroll"
					>
						{#each Object.entries(commentsDelta.comments) as [id, comment]}
							<div
								class="card w-full p-1 shadow-xl scale-95 focus-within:scale-100 hover:scale-100"
							>
								<textarea
									id={comment.id}
									class="textarea text-sm h-20 resize-none overflow-hidden"
									bind:value={commentsDelta.comments[id].comment}
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
							on:click={() => showCharacterDetails()}
							type="button"
							class="m-2 btn-icon bg-surface-200-700-token"
						>
							<Icon class="p-2" data={stickyNote} scale={2.5} />
						</button>
					</div>
					<div class="h-1/4 flex flex-col-reverse items-center">
						{#if changeDelta.length() > 0}
							<button type="button" class="m-2 btn-icon bg-surface-200-700-token">
								<Icon class="p-2" data={refresh} scale={2.5} spin />
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
				</div>
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
