<script lang="ts">
	import type {
		DrawerSettings,
		ModalComponent,
		ModalSettings,
		ToastSettings
	} from '@skeletonlabs/skeleton';
	import {
		AppShell,
		Drawer,
		FileDropzone,
		getDrawerStore,
		getModalStore,
		getToastStore
	} from '@skeletonlabs/skeleton';
	import { afterUpdate, beforeUpdate, onDestroy, onMount } from 'svelte';
	import { trpc } from '$lib/trpc/client';
	import Quill from 'quill';
	import type { Illustration } from '$lib/util/editor/quill';
	import { changeDelta, QuillEditor, type UploadFileToBucketParams } from '$lib/util/editor/quill';
	import '@axone-network/quill-illustration/dist/quill.illustration.d.ts';
	import type { PageData } from './$types';
	import type { HydratedDocument } from 'mongoose';
	import { setupTour, startTour } from './tutorial';
	import Icon from 'svelte-awesome/components/Icon.svelte';
	import {
		check,
		chevronLeft,
		chevronRight,
		dashcube,
		edit,
		image,
		infoCircle,
		plus,
		spinner,
		stickyNote,
		trash,
		unlock,
		star,
		bookmark,
		history,
		lock,
		info
	} from 'svelte-awesome/icons';
	import { page } from '$app/stores';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import RequestPermissionModal from '$lib/components/permissions/RequestPermissionModal.svelte';
	import ChapterNotesModal from '$lib/components/chapter/ChapterNotesModal.svelte';
	import 'quill-comment';
	import { type ChapterProperties, ChapterPropertyBuilder } from '$lib/properties/chapter';
	import IllustrationModal from '$lib/components/chapter/IllustrationModal.svelte';
	import type { EditorMode, StorageFileError } from '$lib/util/types';
	import type { IllustrationObject } from '@axone-network/quill-illustration/dist/quill.illustration.d.ts';
	import BookNav from '$lib/components/book/BookNav.svelte';
	import EditorNav from '$lib/components/editor/EditorNav.svelte';
	import type { UserProperties } from '$lib/properties/user';
	import StorylineReviewModal from '$lib/components/storyline/StorylineReviewModal.svelte';
	import DeltaVersionsModal from '$lib/components/chapter/DeltaVersionsModal.svelte';
	import type { DeltaProperties } from '$lib/properties/delta';
	import Delta from 'quill-delta';
	import type Op from 'quill-delta/dist/Op';
	import { autoStartTour } from '$lib/util/tour/tour';

	export let data: PageData;
	const { supabase } = data;
	$: ({ session, userAuthoredBookResponse: bookData, storylines, selectedStoryline } = data);

	let selectedStorylineChapters: { [key: string]: HydratedDocument<ChapterProperties> } = {};
	$: navChapters = Object.values(selectedStorylineChapters);

	let user: HydratedDocument<UserProperties> | undefined = undefined;

	const toastStore = getToastStore();
	const modalStore = getModalStore();
	const drawerStore = getDrawerStore();

	let mode: EditorMode = ($page.url.searchParams.get('mode') as EditorMode) || 'reader';
	let selectedChapterID = $page.url.searchParams.get('chapterID');

	onMount(() => {
		setupTour();

		loadChapters();
		drawerStore.open(drawerSettings);

		async function getUser() {
			if (session) {
				const maybeUserResponse = await trpc($page).users.getById.query({ id: session?.user.id });
				if (maybeUserResponse.data) {
					user = maybeUserResponse.data as HydratedDocument<UserProperties>;
				}
			}
		}

		getUser();
	});

	/**
	 * Being USED after a chapter add
	 * We cannot update after return of modal result because the editor and the chapter node are out of sync
	 */
	afterUpdate(() => {
		if (!quill || !quill.chapter || quill.chapter._id !== selectedChapter?._id) {
			setupEditor();
		}
		autoStartTour($page.url + '-tour');
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
		background: 'variant-filled-success'
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
		background: 'variant-filled-error'
	};

	function toggleDrawer() {
		if ($drawerStore.open) {
			drawerStore.close();
		} else {
			drawerStore.open(drawerSettings);
		}
	}

	$: selectedChapter = selectedChapterID
		? selectedStorylineChapters[selectedChapterID]
		: Object.keys(selectedStorylineChapters).length !== 0
		? Object.values(selectedStorylineChapters)[0]
		: undefined;
	let leftDrawerSelectedItem = 'copyright';

	function navItemClicked(event: { detail: any }) {
		let itemID = event.detail;

		if (itemID in selectedStorylineChapters) {
			versionPreview = false;
			versionID = undefined;
			selectedChapter = selectedStorylineChapters[itemID];
		} else {
			quill.chapter = undefined;
			selectedChapter = undefined;
			selectedStoryline = storylines[itemID];
			loadChapters();
		}
	}

	let modalComponent: ModalComponent = {
		ref: undefined
	};

	let modalSettings: ModalSettings = {
		type: 'component',
		// Pass the component directly:
		component: modalComponent,
		response: () => {}
	};

	const readingListModal: ModalSettings = {
		type: 'component',
		component: 'readingListModal',
		title: 'Add to Reading List',
		response: (r) => {
			if (r) addToReadingList(r);
		}
	};

	let rateStoryline = () => {
		modalComponent.ref = StorylineReviewModal;
		modalComponent.props = {
			storyline: selectedStoryline
		};
		modalStore.trigger(modalSettings);
	};

	async function addToReadingList(names: string[]) {
		try {
			user = (
				await trpc($page).users.updateReadingLists.mutate({
					names,
					storylineID: selectedStoryline._id
				})
			).data as HydratedDocument<UserProperties>;
		} catch (e) {
			console.log(e);
		}
	}

	function openReadingListModal() {
		readingListModal.meta = {
			user,
			storylineID: selectedStoryline._id
		};
		readingListModal.body = `Select the reading lists to add "${selectedStoryline.title}" to.`;
		modalStore.trigger(readingListModal);
	}

	/**
	 * Chapters
	 */
	async function loadChapters() {
		selectedStorylineChapters = {};
		if (!selectedStoryline.chapters) {
			return;
		}

		if (selectedStoryline.chapters.length === 0) {
			return;
		}

		if (typeof selectedStoryline.chapters[0] !== 'string') {
			selectedStoryline.chapters.forEach((chapter) => {
				if (typeof chapter !== 'string') selectedStorylineChapters[chapter._id] = chapter;
			});
			selectedChapter = selectedStoryline.chapters[0];
			return;
		}

		trpc($page)
			.chapters.getByStoryline.query({
				storylineID: selectedStoryline._id,
				storylineChapterIDs: selectedStoryline.chapters as string[]
			})
			.then((response) => {
				selectedStoryline.chapters = response.data as HydratedDocument<ChapterProperties>[];
				selectedStoryline.chapters.forEach((chapter) => {
					if (typeof chapter !== 'string') selectedStorylineChapters[chapter._id] = chapter;
				});
				selectedChapter = selectedStoryline.chapters[0] as any;
			});
	}

	let showChapterDetails = () => {
		modalComponent.ref = ChapterDetailsModal;
		modalComponent.props = {
			chapter: selectedChapter,
			bookID: bookData._id,
			storylineID: selectedStoryline._id,
			disabled: !isSelectedChapterOwner || selectedChapter?.archived
		};

		modalStore.trigger(modalSettings);
	};

	let showChapterPermissions = () => {
		modalComponent.ref = RequestPermissionModal;
		modalComponent.props = {
			document: selectedChapter
		};
		modalStore.trigger(modalSettings);
	};

	let createChapter = () => {
		let chapterProperties = new ChapterPropertyBuilder().getProperties();
		let newChapterNode: HydratedDocument<ChapterProperties> =
			chapterProperties as HydratedDocument<ChapterProperties>;
		newChapterNode.user = $page.data.user;

		let prevChapterID = '';

		// Object (dictionary) keys are ordered largely by when the key was added
		if (Object.keys(selectedStorylineChapters).length !== 0) {
			prevChapterID = Object.keys(selectedStorylineChapters).pop()!;
		}

		modalComponent.ref = ChapterDetailsModal;
		modalComponent.props = {
			chapter: newChapterNode,
			bookID: bookData._id,
			storylineID: selectedStoryline._id,
			prevChapterID: prevChapterID
		};

		modalSettings.response = createChapterCallback;
		modalStore.trigger(modalSettings);
	};

	let createChapterCallback = (chapterNode: HydratedDocument<ChapterProperties>) => {
		if (!chapterNode) {
			return;
		}

		// Update the UI
		let chapterID = chapterNode._id;
		leftDrawerSelectedItem = chapterID;

		// afterUpdate() will run the setup editor
		selectedStorylineChapters[chapterID] = chapterNode;
		selectedStoryline.chapters?.push(chapterNode as any);

		selectedChapter = chapterNode;
		selectedStorylineChapters = selectedStorylineChapters;
	};

	/**
	 * Deletes all illustrations from supabase storage for this chapter
	 * @param chapter
	 */
	function deleteChapterStorage(chapter: HydratedDocument<ChapterProperties>) {
		const bookId = chapter.book;
		const chapterId = chapter._id;
		const folder = `${bookId}/chapters/${chapterId}`;

		/*
		Be careful if you have a lot of files. Besides server load, if .remove passes data in the url versus body like
		post, you will blow up url length quickly. I don't know how Supabase storage API implements DELETE as body is
		optional. Normally all resources are in the url for DELETE.
		 */
		supabase.storage
			.from('books')
			.list(folder)
			.then((response: StorageFileError) => {
				if (response.data) {
					const filesToRemove = response.data.map((x) => `${folder}/${x.name}`);
					if (filesToRemove.length === 0) {
						return;
					}
					supabase.storage
						.from('books')
						.remove(filesToRemove)
						.then((response: StorageFileError) => {
							if (response.error) {
								console.log(response.error);
								// show toast error
								const errorUploadToast: ToastSettings = {
									message: 'There was an issue deleting the illustrations',
									// Provide any utility or variant background style:
									background: 'variant-filled-error'
								};
								toastStore.trigger(errorUploadToast);
							}
						});
				}
			});
	}

	$: isSelectedChapterOwner = setSelectedChapterOwner(selectedChapter);
	function setSelectedChapterOwner(
		selectedChapter: HydratedDocument<ChapterProperties> | undefined
	) {
		const currentUser = $page.data.user;
		if (!selectedChapter) {
			return false;
		}

		let userID;

		if (typeof selectedChapter.user === 'string') {
			userID = selectedChapter.user;
		} else {
			userID = selectedChapter.user?._id;
		}

		if (userID === currentUser._id) {
			return true;
		}

		return false;
	}

	$: hasSelectedChapterPermissions = setSelectedChapterPermissions(selectedChapter);
	$: canEditSelectedChapter = hasSelectedChapterPermissions && !selectedChapter?.archived;
	function setSelectedChapterPermissions(
		selectedChapter: HydratedDocument<ChapterProperties> | undefined
	) {
		if (!selectedChapter) {
			return false;
		}

		return selectedChapter.userPermissions?.view && selectedChapter.userPermissions?.collaborate;
	}

	let deleteChapter = () => {
		if (!selectedChapter) {
			return;
		}

		const modal: ModalSettings = {
			type: 'confirm',
			// Data
			title: selectedChapter.title,
			body: 'Are you sure you want to delete this chapter?',
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r) {
					//delete all illustrations from supabase storage for this chapter
					deleteChapterStorage(selectedChapter!);

					trpc($page)
						.chapters.delete.mutate({
							id: selectedChapter!._id
						})
						.then((response) => {
							if (response.success) {
								let deletedID = selectedChapter!._id;
								let chapterIDs = Object.keys(selectedStorylineChapters);
								let nextIndex = chapterIDs.indexOf(deletedID) + 1;

								if (nextIndex >= chapterIDs.length) {
									nextIndex = 0;
								}

								selectedChapterID = chapterIDs[nextIndex];
								leftDrawerSelectedItem = selectedChapterID;

								// delete the node first
								delete selectedStorylineChapters[deletedID];
								selectedStoryline.chapters = Object.values(selectedStorylineChapters);

								// give next node if it's available
								selectedChapter = selectedStorylineChapters[selectedChapterID];

								selectedStorylineChapters = selectedStorylineChapters;

								// setup the editor
								setupEditor();
							} else {
								// show toast error
								const deleteFail: ToastSettings = {
									message: response.message,
									// Provide any utility or variant background style:
									background: 'variant-filled-error'
								};
								toastStore.trigger(deleteFail);
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
		modalComponent.props = {
			storylineNode: selectedStoryline,
			chapterNode: selectedChapter,
			disabled: !isSelectedChapterOwner || selectedChapter?.archived
		};
		modalStore.trigger(modalSettings);
	};

	let versionPreview = false;
	let versionID: string | undefined = undefined;

	let versionHistory = () => {
		modalComponent.ref = DeltaVersionsModal;
		modalComponent.props = {
			delta: quill.chapter!.delta,
			selectedVersionID: versionID,
			disabled: !isSelectedChapterOwner || selectedChapter?.archived
		};

		modalSettings.response = createVersionCallback;
		modalStore.trigger(modalSettings);
	};

	let createVersionCallback = (delta: HydratedDocument<DeltaProperties>) => {
		if (!delta) {
			return;
		}

		if (delta._id === '') {
			versionPreview = true;
			versionID = delta.versions?.at(-1)?._id;

			quill.disable();
			quill.setContents(new Delta(delta.ops as Op[]));
			return;
		}

		versionPreview = false;

		// Update the Chapter
		selectedChapter!.delta = delta;
		setupEditor();
	};

	/**
	 * Quill Editor Settings
	 */
	let quill: QuillEditor;
	let showComments = false;
	let showIllustrations = false;
	let deltaChange;
	let numComments = 0;
	let numIllustrations = 0;

	// Subscribe to the quill changeDelta to see if delta has changed
	changeDelta.subscribe((value) => {
		deltaChange = value;
		if (quill) {
			quill.comments = quill.comments;
			quill.illustrations = quill.illustrations;
			numComments = Object.keys(quill.comments).length;
			numIllustrations = Object.keys(quill.illustrations).length;
		}
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
			'illustrations-add'
		]
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
		quill.oldSelectedRange = null; // reset the old range
	}

	/**
	 * Removes the illustration from the quill Parchment
	 * Also removes the illustration from supabase storage
	 * @param id
	 */
	function removeIllustration(id: string) {
		let editor = document.getElementById('editor');

		const src = quill.illustrations[id].illustration.src;
		// bucket name is excluded, but all other folder and file paths are included
		const filename = src.substring(src.indexOf('books') + 'books'.length + 1);

		quill
			.removeIllustration({ id: id, editor: editor, supabase: supabase, filenames: [filename] })
			.then((response: any) => {
				if (response.error) {
					//error
					const errorUploadToast: ToastSettings = {
						message: 'There was an issue deleting the illustration',
						// Provide any utility or variant background style:
						background: 'variant-filled-error'
					};
					toastStore.trigger(errorUploadToast);
				} else {
					//success
					const successUploadToast: ToastSettings = {
						message: 'Illustration has been deleted successfully',
						// Provide any utility or variant background style:
						background: 'variant-filled-success'
					};
					toastStore.trigger(successUploadToast);
				}
			});

		quill.oldSelectedRange = null; // reset the old range
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
		const illustration = newIllustrationObject
			? newIllustrationObject
			: quill.illustrations[id].illustration;
		let editor = document.getElementById('editor');
		quill.updateIllustration(id, editor, illustration);
	}

	function commentAddClick() {
		if (quill.oldSelectedRange === quill.selectedRange) {
			return; // same range is selected
		}

		if (!quill.selectedContainsComment() && !quill.selectedContainsIllustration()) {
			quill.getModule('comment').addComment(' ');
			quill.oldSelectedRange = quill.selectedRange; // update the old selected range
		}

		if (quill.selectedContainsIllustration()) {
			drawerStore.open(drawerSettings);
			showComments = false;
			showIllustrations = true;
		} else {
			drawerStore.open(drawerSettings);
			showComments = true;
			showIllustrations = false;
		}
	}

	/**
	 * Adds an illustration to the quill
	 */
	function illustrationAddClick() {
		if (quill.oldSelectedRange === quill.selectedRange) {
			return; // same range is selected
		}

		if (!quill.selectedContainsComment() && !quill.selectedContainsIllustration()) {
			quill.getModule('illustration').addIllustration({
				src: '',
				alt: '',
				caption: ''
			});
			quill.oldSelectedRange = quill.selectedRange; // update the old selected range
		}

		if (quill.selectedContainsComment()) {
			drawerStore.open(drawerSettings);
			showComments = true;
			showIllustrations = false;
		} else {
			drawerStore.open(drawerSettings);
			showComments = false;
			showIllustrations = true;
		}
	}

	/**
	 * Shows the illustration modal
	 * @param illustration
	 */
	function showIllustrationModal(illustration: Illustration) {
		const modalComponent: ModalComponent = {
			// Pass a reference to your custom component
			ref: IllustrationModal,
			// Add the component properties as key/value pairs
			props: {
				illustration: illustration,
				uploadClick: uploadIllustration
			}
		};

		const modal: ModalSettings = {
			type: 'component',
			// Pass the component directly:
			component: modalComponent
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
	function uploadFileToBucket(
		file: File,
		bucket: string,
		newFileName: string | undefined,
		illustration: Illustration
	) {
		if (!progressToastId) progressToastId = toastStore.trigger(progressUploadToast);

		quill
			.uploadFileToBucket({ supabase, file, bucket, newFileName } as UploadFileToBucketParams)
			.then((response: any) => {
				if (response.data) {
					//success
					//update illustration src, then submit illustration
					illustration.illustration.src = quill.getSupabaseFileURL({
						supabase,
						bucket,
						responsePath: response.data.path
					});
					submitIllustration(illustration.id, illustration.illustration);
					if (progressToastId) {
						toastStore.close(progressToastId);
						progressToastId = undefined;
					}
					toastStore.trigger(successUploadToast);
				} else if (response.error.error === 'Duplicate') {
					//file already exists, rename file and try again
					uploadFileToBucket(file, bucket, 'copy_' + (newFileName || file.name), illustration);
				} else if (
					response.error.error === 'Payload too large' ||
					response.error.statusCode === '413'
				) {
					//file too large
					//show toast error
					if (progressToastId) {
						toastStore.close(progressToastId);
						progressToastId = undefined;
					}
					const errorUploadToast: ToastSettings = {
						message: 'File is too large. Please upload a smaller file.',
						// Provide any utility or variant background style:
						background: 'variant-filled-error'
					};
					toastStore.trigger(errorUploadToast);
				} else {
					//error
					//show toast error
					if (progressToastId) {
						toastStore.close(progressToastId);
						progressToastId = undefined;
					}
					toastStore.trigger(errorUploadToast);
				}
			});
	}

	/**
	 * Uploads an illustration to supabase storage
	 * @param newIllustrationFile - the file to upload or the event that contains the file
	 * @param illustration - the illustration
	 */
	async function uploadIllustration(newIllustrationFile: File | Event, illustration: Illustration) {
		// if the file is an event, get the file from the event
		if (newIllustrationFile instanceof Event) {
			newIllustrationFile = (newIllustrationFile.target as HTMLInputElement)?.files?.[0] as File;
		}

		if (!newIllustrationFile) {
			return; // No file selected
		}

		const chapterId = getCurrentChapter()?._id;
		const bookId = getCurrentChapter()?.book;

		//retrieve supabase storage bucket
		const bucketName = `books/${bookId}/chapters/${chapterId}`;

		//check if bucket exists
		return await quill
			.createIllustrationBucket({
				supabase: supabase,
				bucket: bucketName,
				errorCallback: function () {
					toastStore.trigger(errorUploadToast);
				}
			})
			.then(() => {
				uploadFileToBucket(newIllustrationFile as File, bucketName, undefined, illustration);
			});
	}

	/**
	 * Gets the current chapter from the quill
	 */
	function getCurrentChapter() {
		return quill.chapter;
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
	async function setupEditor() {
		let icons = Quill.import('ui/icons');
		icons['comments-add'] = '<img src="/comments.svg"/>';
		icons['illustrations-add'] = '<img src="/illustrations.svg"/>';

		if (!selectedChapter) {
			return;
		}

		let container = document.getElementById('editor');
		if (container) {
			container.innerHTML = '';
			quill = new QuillEditor(container, selectedChapter, $page, {
				reader: mode === 'reader' ? true : false,
				theme: 'bubble',
				modules: {
					toolbar: {
						container: toolbarOptions
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
				placeholder: mode === 'writer' ? 'Let your voice be heard...' : 'Coming soon...'
			});

			await quill.getChapterDelta();

			numComments = Object.keys(quill.comments).length;
			numIllustrations = Object.keys(quill.illustrations).length;

			clearInterval(saveDeltaInterval);
			saveDeltaInterval = setInterval(quill.saveDelta.bind(quill), 2000);
		}
	}
</script>

<svelte:head>
	<link rel="stylesheet" type="text/css" href="//cdn.quilljs.com/1.3.6/quill.bubble.css" />
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<AppShell class="editor-shell min-h-screen">
	<svelte:fragment slot="sidebarLeft">
		<Drawer
			regionBackdrop="w-2/4 md:w-full !bg-transparent"
			width="w-[180px] md:w-[280px]"
			position="left"
			class="md:!relative h-full"
		>
			<BookNav
				class="p-4 flex flex-col items-center bg-surface-50-900-token h-full"
				bind:chapters={navChapters}
				storylines={Object.values(storylines)}
				selectedStoryline={selectedStoryline._id}
				selectedChapter={selectedChapter?._id}
				on:navItemClicked={navItemClicked}
			/>
		</Drawer>
	</svelte:fragment>
	<svelte:fragment slot="sidebarRight">
		<Drawer
			id="drawer-actions"
			regionBackdrop="w-2/4 md:w-full !bg-transparent"
			width="max-w-[80px]"
			position="right"
			class="md:!relative h-full !left-auto"
		>
			<div class="flex h-full">
				{#if showComments && numComments !== 0}
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

				{#if showIllustrations && numIllustrations !== 0}
					<div
						id="illustrations-container"
						class="w-[200px] right-24 fixed h-full p-2 flex flex-col items-center space-y-2 overflow-y-scroll"
					>
						{#each Object.entries(quill.illustrations) as [id, illustration]}
							<div
								class="card w-full p-1 shadow-xl scale-95 focus-within:scale-100 hover:scale-100"
							>
								{#if quill.illustrations[id].illustration.src.length > 0}
									<img
										id={`src-${illustration.id}`}
										class="h-40 resize-none rounded-md mb-2"
										alt={quill.illustrations[id].illustration.alt ||
											quill.illustrations[id].illustration.caption}
										src={quill.illustrations[id].illustration.src}
										on:click={() => showIllustrationModal(illustration)}
									/>
								{:else}
									<FileDropzone
										name="illustrationDropZone"
										on:change={(event) => uploadIllustration(event, illustration)}
									>
										<svelte:fragment slot="message"
											><strong>Upload an image</strong> or drag and drop</svelte:fragment
										>
										<svelte:fragment slot="meta">PNG, JPG, SVG, and GIF allowed.</svelte:fragment>
									</FileDropzone>
								{/if}
								<input
									type="file"
									id={`file-${illustration.id}`}
									class="hidden"
									accept="image/png, image/jpeg, image/gif, image/svg"
									on:change={replaceIllustrationSrc}
								/>
								<input
									id={`caption-${illustration.id}`}
									type="text"
									class="input text-sm h-6 mb-2 resize-none overflow-hidden focus:border-amber-300"
									placeholder="Caption"
									bind:value={quill.illustrations[id].illustration.caption}
								/>

								<footer class="modal-footer flex flex-col space-x-2 items-center">
									<div>
										<button
											on:click={() => removeIllustration(id)}
											class="chip variant-ghost-surface"
										>
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
						{#if selectedChapter}
							<EditorNav
								{mode}
								menuItems={[
									{
										id: 'chapter-info',
										label: 'Edit chapter details',
										icon: edit,
										callback: showChapterDetails
									},
									{
										id: 'rate-storyline',
										label: 'Rate the storyline',
										icon: star,
										callback: rateStoryline,
										mode: 'reader'
									},
									{
										id: 'view-comments',
										label: 'View chapter comments',
										icon: dashcube,
										callback: toggleShowComments,
										class: 'relative',
										notification: numComments,
										mode: 'writer',
										hidden: numComments === 0
									},
									{
										id: 'view-illustrations',
										label: 'View chapter illustrations',
										icon: image,
										callback: toggleShowIllustrations,
										class: 'relative',
										notification: numIllustrations,
										mode: 'writer',
										hidden: numIllustrations === 0
									},
									{
										id: 'chapter-notes',
										label: 'Add chapter notes',
										icon: stickyNote,
										callback: showChapterNotes,
										mode: 'writer'
									},
									{
										id: 'reading-lists',
										label: 'Add to Reading List',
										icon: bookmark,
										callback: openReadingListModal,
										mode: 'reader'
									},
									{
										id: 'view-permissions',
										label: 'View chapter permissions',
										icon: canEditSelectedChapter ? unlock : lock,
										class: canEditSelectedChapter ? '' : '!bg-error-300-600-token',
										callback: showChapterPermissions,
										mode: 'writer'
									},
									{
										id: 'page-info',
										label: 'Information',
										icon: infoCircle,
										callback: () => {
											startTour();
										}
									}
								]}
							/>
						{/if}
					</div>
					<div class="h-1/4 flex flex-col-reverse items-center">
						<EditorNav
							{mode}
							menuItems={[
								{
									id: 'create-chapter',
									label: 'Create new chapter',
									icon: plus,
									callback: createChapter,
									mode: 'writer'
								},
								{
									id: 'delete-chapter',
									label: 'Delete chapter',
									icon: trash,
									callback: deleteChapter,
									mode: 'writer',
									hidden: isSelectedChapterOwner ? false : true
								},
								{
									id: 'manage-history',
									label: 'Restore chapter version',
									icon: history,
									callback: versionHistory,
									mode: 'writer',
									hidden: isSelectedChapterOwner ? false : true
								},
								{
									id: 'auto-save',
									label: 'Auto Save',
									icon: deltaChange.length() > 0 ? spinner : check,
									pulse: deltaChange.length() > 0 ? true : false,
									callback: () => {},
									class: deltaChange.length() > 0 ? '' : '!bg-success-300-600-token',
									mode: 'writer'
								}
							]}
						/>
					</div>
				</div>
			</div>
		</Drawer>
	</svelte:fragment>
	<svelte:fragment slot="default">
		<div class="flex h-screen w-full overflow-y-clip">
			{#if selectedChapter}
				<div on:click={toggleDrawer} class="flex h-full items-center hover:variant-soft">
					{#if $drawerStore.open}
						<Icon class="flex p-2 justify-start" data={chevronLeft} scale={3} />
					{:else}
						<Icon class="flex p-2 justify-start" data={chevronRight} scale={3} />
					{/if}
				</div>
				<div class="editor-container py-10 flex flex-col w-full items-center">
					{#if versionPreview}
						<button class="btn fixed variant-filled-primary font-sans top-28 w-1/6">
							<span>Version Preview</span>
						</button>
					{/if}
					<div class=" h-[15%]">
						<textarea
							id="message"
							rows="2"
							class="block h-fit p-2.5 resize-none w-full text-center text-2xl md:text-4xl bg-transparent border-transparent focus:border-transparent focus:ring-0"
							placeholder="Chapter Title"
							bind:value={selectedChapter.title}
							disabled
						/>
					</div>
					<div class="w-full !h-[85%]" id="editor" style={cssVarStyles} />
				</div>
				<div on:click={toggleDrawer} class="flex h-full items-center hover:variant-soft">
					{#if $drawerStore.open}
						<Icon class="flex p-2 justify-start" data={chevronRight} scale={3} />
					{:else}
						<Icon class="flex p-2 justify-start" data={chevronLeft} scale={3} />
					{/if}
				</div>
			{:else if !selectedStoryline.userPermissions?.view}
				<div class="flex h-full w-full justify-center items-center">
					<RequestPermissionModal class="mt-4" document={selectedStoryline} />
				</div>
			{/if}
		</div>
	</svelte:fragment>
</AppShell>
