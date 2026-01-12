<script lang="ts">
	import type {
		DrawerSettings,
		ModalComponent,
		ModalSettings,
		ToastSettings
	} from '@skeletonlabs/skeleton';
	import {
		AppShell,
		Avatar,
		Drawer,
		FileDropzone,
		getDrawerStore,
		getModalStore,
		getToastStore
	} from '@skeletonlabs/skeleton';
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import { trpc } from '$lib/trpc/client';
	import type { Resource } from '$lib/util/editor/quill';
	import '$lib/util/editor/resources';
	import { savingDeltaWritable, QuillEditor } from '$lib/util/editor/quill';
	import type { PageData } from './$types';
	import type { HydratedDocument } from 'mongoose';
	import { setupTour, startTour, tour } from './tutorial';
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
		dollar,
		history,
		lock,
		pencil,
		book,
		ellipsisH,
		comments,
		trashO,
		arrowDown
	} from 'svelte-awesome/icons';
	import { page } from '$app/stores';
	import Toolbar from '$lib/components/editor/Toolbar.svelte';
	import ChapterDetailsModal from '$lib/components/chapter/ChapterDetailsModal.svelte';
	import RequestPermissionModal from '$lib/components/permissions/RequestPermissionModal.svelte';
	import ChapterNotesModal from '$lib/components/chapter/ChapterNotesModal.svelte';
	import 'quill-comment';
	import {
		type ChapterProperties,
		ChapterPropertyBuilder,
		type CommentProperties
	} from '$lib/properties/chapter';
	import ResourceModal from '$lib/components/chapter/ResourceModal.svelte';
	import type { EditorMode, StorageFileError, UploadFileToBucketParams } from '$lib/util/types';
	import type { ResourceObject } from '$lib/util/editor/resources';
	import BookNav from '$lib/components/book/BookNav.svelte';
	import EditorNav from '$lib/components/editor/EditorNav.svelte';
	import type { UserProperties } from '$lib/properties/user';
	import StorylineReviewModal from '$lib/components/storyline/StorylineReviewModal.svelte';
	import DeltaVersionsModal from '$lib/components/chapter/DeltaVersionsModal.svelte';
	import type { DeltaProperties } from '$lib/properties/delta';
	import Delta from 'quill-delta';
	import type Op from 'quill-delta/dist/Op';
	import { autoStartTour, getBaseURL } from '$lib/util/tour/tour';
	import { uploadImage } from '$lib/util/bucket/bucket';
	import DocumentCarousel from '$lib/components/documents/DocumentCarousel.svelte';
	import SupportPage from '$lib/components/monetize/SupportPage.svelte';
	import { type PermissionedDocument } from '$lib/properties/permission';
	import { timeAgo, uploadResource } from '$lib/util/constants';
	import TextArea from '$lib/components/TextArea.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import {
		type HydratedResourceProperties,
		type ResourceProperties
	} from '$lib/properties/resource';

	export let data: PageData;
	const { supabase } = data;
	$: ({ session, userAuthoredBookResponse: bookData, storylines, selectedStoryline } = data);

	let selectedStorylineChapters: { [key: string]: HydratedDocument<ChapterProperties> } = {};
	$: navChapters = Object.values(selectedStorylineChapters);

	let user: HydratedDocument<UserProperties> | undefined = undefined;

	const toastStore = getToastStore();
	const modalStore = getModalStore();
	const drawerStore = getDrawerStore();
	// const Tawk_API: any = Tawk_API || {};

	let mode: EditorMode = ($page.url.searchParams.get('mode') as EditorMode) || 'reader';
	let selectedChapterID = $page.url.searchParams.get('chapterID');

	onMount(() => {
		setupTour(tour);

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
		if (!quill) setupEditor();

		const baseURL = getBaseURL($page);
		autoStartTour(tour, baseURL + '-tour');
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

	$: selectedChapter = selectedChapterID
		? selectedStorylineChapters[selectedChapterID]
		: Object.keys(selectedStorylineChapters).length !== 0
		? Object.values(selectedStorylineChapters)[0]
		: undefined;
	let leftDrawerSelectedItem = 'copyright';

	function navItemClicked(event: { detail: any }) {
		let itemID = event.detail;

		if (itemID in selectedStorylineChapters) {
			chapterClicked(itemID);
		} else {
			storylineClicked(itemID);
		}
	}

	function storylineClicked(storylineId: string) {
		selectedChapter = undefined;
		selectedStoryline = storylines[storylineId];
		loadChapters();
	}

	function chapterClicked(chapterId: string) {
		versionPreview = false;
		versionID = undefined;
		selectedChapter = selectedStorylineChapters[chapterId];
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
				console.log('** story');
				console.log(response.message);
				selectedStoryline.chapters = response.data as HydratedDocument<ChapterProperties>[];
				selectedStoryline.chapters.forEach((chapter) => {
					if (typeof chapter !== 'string') selectedStorylineChapters[chapter._id] = chapter;
				});
				selectedChapter = selectedStoryline.chapters[0] as any;
			});
	}

	let showStorylines = () => {
		modalComponent.ref = DocumentCarousel;
		modalComponent.props = {
			documentType: 'Storyline' as PermissionedDocument,
			documents: Object.values(storylines),
			class: 'md:!w-7/12',
			user: data.user,
			supabase: data.supabase
		};

		modalSettings.response = (storylineId) => {
			if (storylineId) storylineClicked(storylineId);
		};
		modalStore.trigger(modalSettings);
	};

	let showSupportPage = () => {
		modalComponent.ref = SupportPage;
		modalComponent.props = {
			documentType: 'Chapter' as PermissionedDocument,
			document: selectedChapter,
			creator: selectedChapter?.user,
			class: 'md:!w-7/12'
		};

		modalStore.trigger(modalSettings);
	};

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
	 * Deletes all resources from supabase storage for this chapter
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
									message: 'There was an issue deleting the resources',
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

	$: isChapterSelected = setChapterSelected(selectedChapter);
	function setChapterSelected(selectedChapter: HydratedDocument<ChapterProperties> | undefined) {
		if (!selectedChapter) {
			return false;
		}
		return true;
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
					//delete all resources from supabase storage for this chapter
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
			chapter: selectedChapter,
			disabled: !isSelectedChapterOwner || selectedChapter?.archived
		};

		modalSettings.response = (chapterNotes) => {
			if (chapterNotes) {
				selectedChapter!.chapterNotes = chapterNotes;
			}
		};
		modalStore.trigger(modalSettings);
	};

	let versionPreview = false;
	let versionID: string | undefined = undefined;

	let versionHistory = () => {
		modalComponent.ref = DeltaVersionsModal;
		modalComponent.props = {
			delta: selectedChapter!.delta,
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
	let showAuthorComments = false;
	let showReaderComments = false;
	let showResources = false;
	let savingDelta: boolean;
	let numComments = 0;
	let numResources = 0;

	// Subscribe to the quill changeDelta to see if delta has changed
	savingDeltaWritable.subscribe((value) => {
		savingDelta = value;
		if (quill) {
			quill.comments = quill.comments;
			quill.resources = quill.resources;
			numComments = Object.keys(quill.comments).length;
			numResources = Object.keys(quill.resources).length;
		}
	});

	$: commentBgColor = showAuthorComments ? 'var(--color-primary-500)' : '';
	$: resourceBgColor = showResources ? 'var(--color-warning-800)' : '';
	$: cssVarStyles = `--comment-bg-color:${commentBgColor}; --resource-bg-color:${resourceBgColor};`;

	/**
	 * Toggles the showComments boolean and updates the quill module
	 *
	 */
	function toggleShowAuthorComments() {
		if (showResources && !showAuthorComments) {
			toggleShowResources();
		}
		showAuthorComments = !showAuthorComments;
	}

	function toggleShowUserComments() {
		showReaderComments = !showReaderComments;
	}

	/**
	 * Toggles the showResources boolean and updates the quill module
	 */
	function toggleShowResources() {
		if (showAuthorComments && !showResources) {
			toggleShowAuthorComments();
		}
		showResources = !showResources;
		// if (showResources) quill.getModule('resource').addResourceStyle('green')
		// else quill.getModule('resource').addResourceStyle('transparent')
	}

	function removeComment(id: string) {
		let editor = document.getElementById('editor');
		quill.removeComment(id, editor);
		quill.oldSelectedRange = null; // reset the old range
	}

	let readerComment = '';
	function deleteReaderComment(id: string) {
		trpc($page)
			.chapters.deleteComment.mutate({
				chapterId: selectedChapter ? selectedChapter._id : '',
				commentId: id
			})
			.then((response) => {
				const deletedId = response.data;
				if (selectedChapter) {
					selectedChapter.comments = selectedChapter.comments?.filter(
						(comment) => comment._id !== deletedId
					);
					selectedChapter.commentsCount = (selectedChapter.commentsCount ?? 1) - 1;
				}
			});
	}

	function submitReaderComment(comment: string) {
		trpc($page)
			.chapters.createComment.mutate({
				chapterId: selectedChapter ? selectedChapter._id : '',
				comment: comment
			})
			.then((response) => {
				if (selectedChapter && response.success) {
					let comments = selectedChapter.comments ?? [];
					comments.unshift(response.data as CommentProperties);

					selectedChapter.comments = comments;
					selectedChapter.commentsCount = (selectedChapter.commentsCount ?? 0) + 1;
				}
				readerComment = '';
			});
	}

	function loadMoreReaderComments() {
		trpc($page)
			.chapters.getComments.mutate({
				id: selectedChapter ? selectedChapter._id : '',
				skip: selectedChapter?.comments?.length,
				limit: 5
			})
			.then((response) => {
				if (selectedChapter) {
					selectedChapter.comments = selectedChapter?.comments?.concat(
						response.data as CommentProperties[]
					);
				}
			});
	}

	/**
	 * Removes the resource from the quill Parchment
	 * Also removes the resource from supabase storage
	 * @param id
	 */
	function removeResource(id: string) {
		let editor = document.getElementById('editor');

		const src = quill.resources[id].resource.src;
		// bucket name is excluded, but all other folder and file paths are included
		const filename = src.substring(src.indexOf('books') + 'books'.length + 1);

		quill
			.removeResource({ id: id, editor: editor, supabase: supabase, filenames: [filename] })
			.then((response: any) => {
				if (response.error) {
					//error
					const errorUploadToast: ToastSettings = {
						message: 'There was an issue deleting the resource',
						// Provide any utility or variant background style:
						background: 'variant-filled-error'
					};
					toastStore.trigger(errorUploadToast);
				} else {
					//success
					const successUploadToast: ToastSettings = {
						message: 'Resource has been deleted successfully',
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
	 * Updates existing resource by getting the blot from the quill Parchment
	 * @param id - the id of the resource
	 * @param newResource - the new resource object
	 */
	function submitResource(
		id: string,
		newResource: HydratedDocument<ResourceProperties> | undefined
	) {
		if (!newResource) {
			return;
		}
		let editor = document.getElementById('editor');
		quill.updateResource(id, editor, newResource);
	}

	function commentAddClick() {
		if (quill.oldSelectedRange === quill.selectedRange) {
			return; // same range is selected
		}

		if (!quill.selectedContainsComment() && !quill.selectedContainsResource()) {
			quill.getModule('comment').addComment(' ');
			quill.oldSelectedRange = quill.selectedRange; // update the old selected range
		}

		if (quill.selectedContainsResource()) {
			drawerStore.open(drawerSettings);
			showAuthorComments = false;
			showResources = true;
		} else {
			drawerStore.open(drawerSettings);
			showAuthorComments = true;
			showResources = false;
		}
	}

	/**
	 * Adds an resource to the quill
	 */
	async function resourceAddClick() {
		quill.addResource(selectedChapter!._id);

		if (quill.selectedContainsComment()) {
			drawerStore.open(drawerSettings);
			showAuthorComments = true;
			showResources = false;
		} else {
			drawerStore.open(drawerSettings);
			showAuthorComments = false;
			showResources = true;
		}
	}

	/**
	 * Shows the resource modal
	 * @param resource
	 */
	function showResourceModal(resource: HydratedDocument<ResourceProperties>) {
		const modalComponent: ModalComponent = {
			// Pass a reference to your custom component
			ref: ResourceModal,
			// Add the component properties as key/value pairs
			props: {
				resource: resource,
				uploadClick: uploadResource
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
	 * Uploads an resource to supabase storage
	 * @param newResourceFile - the file to upload or the event that contains the file
	 * @param resource - the resource
	 */
	async function saveResource(
		newResourceFile: File | Event,
		resource: HydratedDocument<HydratedResourceProperties>
	) {
		const response = await uploadResource(newResourceFile, resource, supabase, toastStore);

		if (response.success) {
			console.log('!! resource');
			console.log(resource);
			submitResource(resource._id, resource);
		}

		toastStore.trigger({
			message: response.message,
			// Provide any utility or variant background style:
			background: response.success ? 'variant-filled-success' : 'variant-filled-error'
		});
	}

	/**
	 * Replaces the resource image element src with the selected file's src
	 * @param event
	 */
	function replaceResourceSrc(event: Event) {
		const inputElement = event.target as HTMLInputElement;
		const inputElementId = inputElement.id;
		const resourceId = inputElementId.substring(inputElementId.indexOf('-') + 1);
		const file = inputElement.files?.[0];

		if (!file) {
			return; // No file selected
		}

		const imageElement = document.getElementById(`src-${resourceId}`) as HTMLImageElement;
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

	function resourceServerTimestamp() {
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
	$: selectedChapter && setupEditor();

	async function setupEditor() {
		if (!selectedChapter) {
			return;
		}

		let container = document.getElementById('editor');
		if (container) {
			container.innerHTML = '';
			quill = new QuillEditor(container, selectedStorylineChapters, $page, {
				reader: mode === 'reader' ? true : false,
				theme: 'snow',
				modules: {
					toolbar: {
						container: '#ql-toolbar'
					},
					comment: {
						enabled: true,
						commentAuthorId: session?.user.id,
						commentAddOn: session?.user.email, // any additional info needed
						commentAddClick: commentAddClick, // get called when `ADD COMMENT` btn on options bar is clicked
						commentTimestamp: commentServerTimestamp
					},
					resource: {
						enabled: true,
						color: 'transparent',
						resourceAuthorId: session?.user.id,
						resourceAddOn: session?.user.email, // any additional info needed
						resourceAddClick: resourceAddClick, // get called when `ADD RESOURCE` btn on options bar is clicked
						resourceTimestamp: resourceServerTimestamp
					},
					history: {
						delay: 1000,
						maxStack: 500
					}
				},
				placeholder: mode === 'writer' ? 'Let your voice be heard...' : 'Coming soon...'
			});

			await quill.getChapterDelta(selectedChapter._id);

			await quill.getChapterNotes(selectedChapter._id);

			numComments = Object.keys(quill.comments).length;
			numResources = Object.keys(quill.resources).length;

			clearInterval(saveDeltaInterval);
			saveDeltaInterval = setInterval(() => {
				quill.saveDelta(selectedChapter!._id);
			}, 2000);
		}
	}
</script>

<svelte:head>
	<!-- <link rel="stylesheet" type="text/css" href="//cdn.quilljs.com/1.3.6/quill.bubble.css" /> -->
	<link rel="stylesheet" type="text/css" href="//cdn.quilljs.com/1.3.6/quill.snow.css" />
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<AppShell class="editor-shell min-h-screen">
	<svelte:fragment slot="sidebarLeft">
		<Drawer
			regionBackdrop="w-2/4 md:w-full !bg-transparent"
			width="w-[180px] md:w-[280px]"
			position="left"
			class="md:!relative h-full pt-24 md:pt-1"
		>
			<BookNav
				class="p-4 flex flex-col items-center bg-surface-50-900-token h-full"
				bind:chapters={navChapters}
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
			class="md:!relative h-full !left-auto pt-24 md:pt-1"
		>
			<div class="flex h-full">
				{#if showAuthorComments && numComments !== 0}
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

				{#if showReaderComments && selectedChapter}
					<div
						id="comments-container"
						class="w-[30%] right-24 fixed h-[90%] p-2 flex flex-col items-center space-y-2 overflow-y-scroll"
					>
						<div class="card z-50 w-full p-2 scale-95 focus-within:scale-100 hover:scale-100">
							<TextArea
								submitButton={true}
								submit={submitReaderComment}
								placeholder="Add a comment"
								maxLength={100}
								bind:textContent={readerComment}
							/>
						</div>
						{#each selectedChapter.comments ?? [] as comment}
							<div
								class="card w-full p-1 shadow-xl scale-95 focus-within:scale-100 hover:scale-100"
							>
								<div class="card grid grid-cols-[auto_1fr] gap-2 p-2">
									<div class="w-12 flex flex-col items-center gap-2 justify-between">
										<Avatar width="w-10" src={comment.imageURL} />
										{#if comment.userId === session?.user.id}
											<button
												on:click={() => deleteReaderComment(comment._id)}
												type="button"
												class="btn-icon variant-filled w-fit p-2"
												><Icon scale={1} class="w-fit" data={trash} /></button
											>
										{/if}
									</div>
									<div class="p-4 variant-soft-surface rounded-tl-none space-y-2">
										<header class="flex justify-between items-center">
											<p class="font-bold">{comment.firstName}</p>
											<small class="opacity-50">{timeAgo(comment.date)}</small>
										</header>
										<p>{comment.comment}</p>
									</div>
								</div>
							</div>
						{/each}
						{#if selectedChapter.comments && selectedChapter.comments.length < (selectedChapter.commentsCount ?? 0)}
							<div class="flex justify-center my-12">
								<Tooltip
									on:click={loadMoreReaderComments}
									content="Load more"
									placement="top"
									target="reading-list"
								>
									<button class="btn-icon variant-filled">
										<Icon data={arrowDown} />
									</button>
								</Tooltip>
							</div>
						{/if}
					</div>
				{/if}

				{#if showResources && numResources !== 0}
					<div
						id="resources-container"
						class="w-[200px] right-24 fixed h-full p-2 flex flex-col items-center space-y-2 overflow-y-scroll"
					>
						{#each quill.resourcesData as resourceData}
							<div
								class="card w-full p-1 shadow-xl scale-95 focus-within:scale-100 hover:scale-100"
							>
								{#if resourceData.src}
									<div class="h-40 w-full object-cover overflow-hidden">
										<img
											id={`src-${resourceData._id}`}
											class="resize-none rounded-md mb-2 w-full"
											alt={resourceData.title}
											src={resourceData.src}
											on:click={() => showResourceModal(resourceData)}
										/>
									</div>
								{:else}
									<FileDropzone
										name="resourceDropZone"
										on:change={(event) => saveResource(event, resourceData)}
									>
										<svelte:fragment slot="message"
											><strong>Upload an image</strong> or drag and drop</svelte:fragment
										>
										<svelte:fragment slot="meta">PNG, JPG, SVG, and GIF allowed.</svelte:fragment>
									</FileDropzone>
								{/if}
								<input
									type="file"
									id={`file-${resourceData._id}`}
									class="hidden"
									accept="image/png, image/jpeg, image/gif, image/svg"
									on:change={replaceResourceSrc}
								/>
								<input
									id={`caption-${resourceData._id}`}
									type="text"
									class="input text-sm h-6 mb-2 resize-none overflow-hidden focus:border-amber-300"
									placeholder="Caption"
									bind:value={resourceData.title}
								/>

								<footer class="modal-footer flex flex-col space-x-2 items-center">
									<div>
										<button
											on:click={() => removeResource(resourceData._id)}
											class="chip variant-ghost-surface"
										>
											Remove
										</button>
										<button
											on:click={() => submitResource(resourceData._id, undefined)}
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

				<div class="flex flex-col p-2 bg-surface-50-900-token mb-14">
					<div class="h-3/4 flex flex-col items-center">
						<EditorNav
							{mode}
							menuItems={[
								{
									id: 'view-storylines',
									label: 'View more storylines',
									icon: ellipsisH,
									class: '!bg-primary-300-600-token',
									callback: showStorylines,
									hidden: Object.keys(storylines).length <= 1
								},
								{
									id: 'toggle-mode',
									label: mode === 'writer' ? 'Reader Mode' : 'Writer Mode',
									icon: mode === 'writer' ? book : pencil,
									class: '!bg-warning-300-600-token',
									callback: () => {
										mode = mode === 'writer' ? 'reader' : 'writer';
										setupEditor();
									},
									hidden: !selectedChapter?.userPermissions?.collaborate
								},
								{
									id: 'reading-lists',
									label: 'Support the author!',
									icon: dollar,
									callback: showSupportPage,
									hidden: !selectedChapter,
									mode: 'reader'
								},
								{
									id: 'chapter-info',
									label: isSelectedChapterOwner ? 'Edit chapter details' : 'View chapter details',
									icon: edit,
									callback: showChapterDetails,
									hidden: !isChapterSelected
								},
								{
									id: 'rate-storyline',
									label: 'Rate the storyline',
									icon: star,
									callback: rateStoryline,
									mode: 'reader',
									hidden: !isChapterSelected
								},
								{
									id: 'view-comments',
									label: 'View author comments',
									icon: dashcube,
									callback: toggleShowAuthorComments,
									class: 'relative',
									notification: numComments,
									mode: 'writer',
									hidden: !isChapterSelected || numComments === 0
								},
								{
									id: 'view-comments',
									label: 'View user comments',
									icon: comments,
									callback: toggleShowUserComments,
									class: 'relative',
									notification: selectedChapter?.commentsCount,
									mode: 'reader',
									hidden: !isChapterSelected
								},
								{
									id: 'view-resources',
									label: 'View chapter resources',
									icon: image,
									callback: toggleShowResources,
									class: 'relative',
									notification: numResources,
									mode: 'writer',
									hidden: !isChapterSelected || numResources === 0
								},
								{
									id: 'chapter-notes',
									label: 'Add chapter notes',
									icon: stickyNote,
									callback: showChapterNotes,
									class: 'relative',
									notification: selectedChapter?.chapterNotes?.length,
									mode: 'writer',
									hidden: !isChapterSelected
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
									mode: 'writer',
									hidden: !isChapterSelected
								},
								{
									id: 'page-info',
									label: 'Information',
									icon: infoCircle,
									callback: () => {
										startTour(tour);
									}
								}
							]}
						/>
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
									icon: savingDelta ? spinner : check,
									pulse: savingDelta ? true : false,
									callback: () => {},
									class: savingDelta ? '' : '!bg-success-300-600-token',
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
		<div class="flex justify-between h-screen w-full overflow-y-clip">
			<div on:click={toggleDrawer} class="flex h-full items-center hover:variant-soft">
				{#if $drawerStore.open}
					<Icon class="flex p-2 justify-start" data={chevronLeft} scale={3} />
				{:else}
					<Icon class="flex p-2 justify-start" data={chevronRight} scale={3} />
				{/if}
			</div>
			{#if selectedChapter}
				<div class="editor-container flex flex-col h-full w-full items-center overflow-scroll">
					{#if versionPreview}
						<button class="btn fixed variant-filled-primary font-sans top-28 w-1/6">
							<span>Version Preview</span>
						</button>
					{/if}
					<div class="w-full h-[15%]">
						<textarea
							id="message"
							rows="1"
							class="block text-primary-700-200-token resize-none h-fit p-2.5 w-full text-center text-2xl md:text-4xl bg-transparent border-transparent focus:border-transparent focus:ring-0"
							placeholder="Storyline Title"
							bind:value={selectedStoryline.title}
							disabled
						/>
						<textarea
							id="message"
							rows="1"
							class="block resize-none h-fit p-2.5 w-full text-center text-xl md:text-2xl bg-transparent border-transparent focus:border-transparent focus:ring-0"
							placeholder="Chapter Title"
							bind:value={selectedChapter.title}
							disabled
						/>
					</div>

					<Toolbar class="{mode === 'writer' ? '' : 'hidden'} m-4" />
					<div class="w-10/12 !h-fit" id="editor" style={cssVarStyles} />
				</div>
			{:else if !selectedStoryline.userPermissions?.view}
				<div class="flex h-full w-full justify-center items-center">
					<RequestPermissionModal class="mt-4" document={selectedStoryline} />
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
