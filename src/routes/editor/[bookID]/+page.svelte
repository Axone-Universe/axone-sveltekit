<script lang="ts">
	import type {DrawerSettings, ModalComponent, ModalSettings, ToastSettings} from '@skeletonlabs/skeleton';
	import {
		Accordion,
		AccordionItem,
		AppShell,
		Drawer,
		drawerStore,
		FileDropzone,
		LightSwitch,
		ListBox,
		ListBoxItem,
		modalStore,
		toastStore
	} from '@skeletonlabs/skeleton';
	import {afterUpdate, beforeUpdate, onDestroy, onMount} from 'svelte';
	import {trpc} from '$lib/trpc/client';
	import Quill from 'quill';
	import type {Illustration} from '$lib/util/editor/quill'
	import {changeDelta, QuillEditor, type UploadFileToBucketParams} from '$lib/util/editor/quill';
	import '@axone-network/quill-illustration/dist/quill.illustration.d.ts'
	import type {PageData} from './$types';
	import type {HydratedDocument} from 'mongoose';

	import Icon from 'svelte-awesome';
	import {
		check,
		chevronLeft,
		chevronRight,
		dashcube,
		edit,
		image,
		plus,
		spinner,
		stickyNote,
		trash,
	} from 'svelte-awesome/icons';
	import {page} from '$app/stores';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import ChapterNotesModal from '$lib/components/chapter/ChapterNotesModal.svelte';
	import 'quill-comment';
	import {type ChapterProperties, ChapterPropertyBuilder} from '$lib/shared/chapter';
	import BookHeader from '$lib/components/book/BookHeader.svelte';
	import IllustrationModal from "$lib/components/chapter/IllustrationModal.svelte";
	import type {StorageBucketError, StorageError, StorageFileError} from "$lib/util/types";
	import type { IllustrationObject } from '@axone-network/quill-illustration/dist/quill.illustration.d.ts'

	export let data: PageData;
	const { supabase } = data;
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

	/**
	 * Toast settings
	 */
	const successUploadToast: ToastSettings = {
		message: 'Illustration has been uploaded successfully',
		// Provide any utility or variant background style:
		background: 'variant-filled-success',
	};
	const progressUploadToast: ToastSettings = {
		message: 'Uploading illustration...',
		// Provide any utility or variant background style:
		background: 'variant-filled-secondary',
		autohide: false
	};
	const errorUploadToast: ToastSettings = {
		message: 'There was an issue uploading the illustration',
		// Provide any utility or variant background style:
		background: 'variant-filled-error',
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

	/**
	 * Deletes all illustrations from supabase storage for this chapter
	 * @param chapter
	 */
	function deleteChapterStorage(chapter: HydratedDocument<ChapterProperties>){
		const bookId = chapter.book
		const chapterId = chapter._id
		const folder = `${bookId}/chapters/${chapterId}`

		/*
		Be careful if you have a lot of files. Besides server load, if .remove passes data in the url versus body like
		post, you will blow up url length quickly. I don't know how Supabase storage API implements DELETE as body is
		optional. Normally all resources are in the url for DELETE.
		 */
		supabase.storage
				.from('books')
				.list(folder)
				.then((response: StorageFileError) => {
					if (response.data){
						const filesToRemove = response.data.map((x) => `${folder}/${x.name}`);
						supabase.storage
								.from('books')
								.remove(filesToRemove)
								.then((response: StorageFileError) => {
									if (response.error) {
										console.log(response.error)
										// show toast error
										const errorUploadToast: ToastSettings = {
											message: 'There was an issue deleting the illustrations',
											// Provide any utility or variant background style:
											background: 'variant-filled-error',
										};
										toastStore.trigger(errorUploadToast);
									}
								})
					}
				})

	}

	let deleteChapter = () => {
		const modal: ModalSettings = {
			type: 'confirm',
			// Data
			title: selectedChapterNode.title,
			body: 'Are you sure you wish to delete this chapter?',
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r) {
					//delete all illustrations from supabase storage for this chapter
					deleteChapterStorage(selectedChapterNode)

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
	let showComments = false;
	let showIllustrations = false;
	let deltaChange;

	// Subscribe to the quill changeDelta to see if delta has changed
	changeDelta.subscribe((value) => {
		deltaChange = value;
		quill.comments = quill.comments;
		quill.illustrations = quill.illustrations;
	});

	// Quill toolbar options
	let toolbarOptions = [
		['bold', 'italic', 'underline', 'strike'],
		['blockquote', { indent: '+1' }],
		[
			{ align: '' },
			{ align: 'center' },
			{ align: 'right' },
			{ align: 'justify' },
			'comments-add',
			'comments-toggle',
			'illustrations-add',
		],
	];

	$: commentBgColor = showComments ? 'var(--color-primary-500)' : '';
	$: illustrationBgColor = showIllustrations ? 'var(--color-warning-800)' : '';
	$: cssVarStyles = `--comment-bg-color:${commentBgColor}; --illustration-bg-color:${illustrationBgColor};`;

	/**
	 * Toggles the showComments boolean and updates the quill module
	 *
	 */
	function toggleShowComments() {
		if (showIllustrations && !showComments) {
			toggleShowIllustrations();
		}
		showComments = !showComments;
	}

	/**
	 * Toggles the showIllustrations boolean and updates the quill module
	 */
	function toggleShowIllustrations() {
		if (showComments && !showIllustrations) {
			toggleShowComments();
		}
		showIllustrations = !showIllustrations;
		// if (showIllustrations) quill.getModule('illustration').addIllustrationStyle('green')
		// else quill.getModule('illustration').addIllustrationStyle('transparent')
	}

	function removeComment(id: string) {
		let editor = document.getElementById('editor');
		quill.removeComment(id, editor);
	}

	/**
	 * Removes the illustration from the quill Parchment
	 * Also removes the illustration from supabase storage
	 * @param id
	 */
	function removeIllustration(id: string) {
		let editor = document.getElementById('editor');

		const src = quill.illustrations[id].illustration.src
		// bucket name is excluded, but all other folder and file paths are included
		const filename = src.substring(src.indexOf('books') + 'books'.length + 1)

		quill.removeIllustration({id: id, editor: editor, supabase: supabase, filenames: [filename]})
				.then((response: StorageFileError) => {
					if (!response.data) {

						//error
						const errorUploadToast: ToastSettings = {
							message: 'There was an issue deleting the illustration',
							// Provide any utility or variant background style:
							background: 'variant-filled-error',
						};
						toastStore.trigger(errorUploadToast);
					}else{
						//success
						const successUploadToast: ToastSettings = {
							message: 'Illustration has been deleted successfully',
							// Provide any utility or variant background style:
							background: 'variant-filled-success',
						};
						toastStore.trigger(successUploadToast);
					}
				})

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

	/**
	 * Updates existing illustration by getting the blot from the quill Parchment
	 * @param id - the id of the illustration
	 * @param newIllustrationObject - the new illustration object
	 */
	function submitIllustration(id: string, newIllustrationObject: IllustrationObject | undefined) {
		const illustration = newIllustrationObject ? newIllustrationObject : quill.illustrations[id].illustration;
		let editor = document.getElementById('editor');
		quill.updateIllustration(id, editor, illustration);
	}

	function commentAddClick() {
		if (!quill.selectedContainsComment()) quill.getModule('comment').addComment(' ');
		drawerStore.open(drawerSettings);
		showComments = true;
		showIllustrations = false;
	}

	/**
	 * Adds an illustration to the quill
	 */
	function illustrationAddClick() {
		if (!quill.selectedContainsIllustration()) {
			quill.getModule('illustration').addIllustration({
				src: '',
				alt: '',
				caption: ''
			});
		}
		drawerStore.open(drawerSettings);
		showIllustrations = true;
		showComments = false;
	}

	/**
	 * Shows the illustration modal
	 * @param illustration
	 */
	function showIllustrationModal(illustration: Illustration){
		const modalComponent: ModalComponent = {
			// Pass a reference to your custom component
			ref: IllustrationModal,
			// Add the component properties as key/value pairs
			props: {
				illustration: illustration,
				uploadClick: uploadIllustration
			},
		};

		const modal: ModalSettings = {
			type: 'component',
			// Pass the component directly:
			component: modalComponent,
		};
		modalStore.trigger(modal);
	}



	/**
	 * Uploads a file to a supabase storage bucket
	 * @param file - the file to upload
	 * @param bucket - the bucket to upload to
	 * @param newFileName - the new file name to use
	 * @param illustration - the illustration object
	 */
	let progressToastId: string | undefined = undefined;
	function uploadFileToBucket (file: File, bucket: string, newFileName: string | undefined, illustration: Illustration) {
		if (!progressToastId)
			progressToastId = toastStore.trigger(progressUploadToast);

		quill.uploadFileToBucket({supabase, file, bucket, newFileName} as UploadFileToBucketParams)
				.then((response: StorageError) => {
					if (response.data){
						//success
						//update illustration src, then submit illustration
						illustration.illustration.src = quill.getSupabaseFileURL({supabase, bucket, responsePath: response.data.path})
						submitIllustration(illustration.id, illustration.illustration)
						if (progressToastId) {
							toastStore.close(progressToastId)
							progressToastId = undefined
						}
						toastStore.trigger(successUploadToast);
					} else if (response.error.error === "Duplicate") {
						//file already exists, rename file and try again
						uploadFileToBucket(file, bucket, ('copy_' + (newFileName || file.name)), illustration)
					} else if (response.error.error === "Payload too large" || response.error.statusCode === "413"){
						//file too large
						//show toast error
						if (progressToastId) {
							toastStore.close(progressToastId)
							progressToastId = undefined
						}
						const errorUploadToast: ToastSettings = {
							message: 'File is too large. Please upload a smaller file.',
							// Provide any utility or variant background style:
							background: 'variant-filled-error',
						};
						toastStore.trigger(errorUploadToast);
					} else {
						//error
						//show toast error
						if (progressToastId) {
							toastStore.close(progressToastId)
							progressToastId = undefined
						}
						toastStore.trigger(errorUploadToast);
					}
				})

	}

	/**
	 * Uploads an illustration to supabase storage
	 * @param newIllustrationFile - the file to upload or the event that contains the file
	 * @param illustration - the illustration
	 */
	async function uploadIllustration (newIllustrationFile: File | Event, illustration: Illustration) {
		// if the file is an event, get the file from the event
		if (newIllustrationFile instanceof Event) {
			newIllustrationFile = (newIllustrationFile.target as HTMLInputElement)?.files?.[0] as File;
		}

		if (!newIllustrationFile) {
			return; // No file selected
		}

		const chapterId = getCurrentChapter()?._id
		const bookId = getCurrentChapter()?.book

		//retrieve supabase storage bucket
		const bucketName = `books/${bookId}/chapters/${chapterId}`

		//check if bucket exists
		return await quill.createIllustrationBucket({
			supabase: supabase,
			bucket: bucketName,
			errorCallback: function () {
				toastStore.trigger(errorUploadToast);
			}
		}).then(() => {
			uploadFileToBucket(newIllustrationFile as File, bucketName, undefined, illustration)
		})

	}

	/**
	 * Gets the current chapter from the quill
	 */
	function getCurrentChapter(){
		return quill.chapter
	}

	/**
	 * Replaces the illustration image element src with the selected file's src
	 * @param event
	 */
	function replaceIllustrationSrc(event: Event) {
		const inputElement = event.target as HTMLInputElement;
		const inputElementId = inputElement.id;
		const illustrationId = inputElementId.substring(inputElementId.indexOf('-') + 1);
		const file = inputElement.files?.[0];

		if (!file) {
			return; // No file selected
		}

		const imageElement = document.getElementById(`src-${illustrationId}`) as HTMLImageElement;
		const reader = new FileReader();
		reader.onload = (e) => {
			if (e.target?.result) {
				imageElement.src = e.target.result as string;
			}
		};
		reader.readAsDataURL(file);
	}

	function commentServerTimestamp() {
		// call from server or local time. But must return promise with UNIX Epoch timestamp resolved (like 1507617041)
		return new Promise((resolve, reject) => {
			let currentTimestamp = Math.round(new Date().getTime() / 1000);

			resolve(currentTimestamp);
		});
	}

	function illustrationServerTimestamp() {
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
		icons['illustrations-add'] = '<img src="/illustrations.svg"/>';

		let container = document.getElementById('editor');
		if (container) {
			container.innerHTML = '';
			quill = new QuillEditor(container, selectedChapterNode, $page, {
				reader: false,
				theme: 'bubble',
				modules: {
					toolbar: {
						container: toolbarOptions,
					},
					comment: {
						enabled: true,
						commentAuthorId: session?.user.id,
						commentAddOn: session?.user.email, // any additional info needed
						commentAddClick: commentAddClick, // get called when `ADD COMMENT` btn on options bar is clicked
						commentTimestamp: commentServerTimestamp
					},
					illustration: {
						enabled: true,
						color: 'transparent',
						illustrationAuthorId: session?.user.id,
						illustrationAddOn: session?.user.email, // any additional info needed
						illustrationAddClick: illustrationAddClick, // get called when `ADD ILLUSTRATION` btn on options bar is clicked
						illustrationTimestamp: illustrationServerTimestamp
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

				{#if showIllustrations && Object.keys(quill.illustrations).length !== 0}
					<div
							id="illustrations-container"
							class="w-[200px] right-24 fixed h-full p-2 flex flex-col items-center space-y-2 overflow-y-scroll"
					>
						{#each Object.entries(quill.illustrations) as [id, illustration]}
							<div
									class="card w-full p-1 shadow-xl scale-95 focus-within:scale-100 hover:scale-100"
							>
								{#if (quill.illustrations[id].illustration.src.length > 0)}
									<img
											id={`src-${illustration.id}`}
											class="h-40 resize-none rounded-md mb-2"
											alt={quill.illustrations[id].illustration.alt || quill.illustrations[id].illustration.caption}
											src={quill.illustrations[id].illustration.src}
											on:click={() => showIllustrationModal(illustration)}
									>
								{:else}
									<FileDropzone name="illustrationDropZone"  on:change={(event) => uploadIllustration(event, illustration)}
									>
										<svelte:fragment slot="message"><strong>Upload an image</strong> or drage and drop</svelte:fragment>
										<svelte:fragment slot="meta">PNG, JPG, SVG, and GIF allowed.</svelte:fragment>
									</FileDropzone>
								{/if}
								<input
										type="file"
										id={`file-${illustration.id}`}
										class="hidden"
										accept="image/png, image/jpeg, image/gif, image/svg"
										on:change={replaceIllustrationSrc}
								>
								<input
										id={`caption-${illustration.id}`}
										type="text"
										class="input text-sm h-6 mb-2 resize-none overflow-hidden focus:border-amber-300"
										placeholder="Caption"
										bind:value={quill.illustrations[id].illustration.caption}
								>

								<footer class="modal-footer flex flex-col space-x-2 items-center">
									<div>
										<button on:click={() => removeIllustration(id)} class="chip variant-ghost-surface">
											Remove
										</button>
										<button
												on:click={() => submitIllustration(id, undefined)}
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
									on:click={() => toggleShowIllustrations()}
									type="button"
									class="m-2 btn-icon bg-surface-200-700-token"
							>
								<Icon class="p-2" data={image} scale={2.5} />
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
