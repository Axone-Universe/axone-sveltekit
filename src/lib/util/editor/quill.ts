import Delta from 'quill-delta';
import type Op from 'quill-delta/dist/Op';
import Quill, { type QuillOptionsStatic, type Sources } from 'quill';
import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from '$lib/properties/chapter';
import { trpc } from '$lib/trpc/client';
import type { Page } from '@sveltejs/kit';
import type { DeltaProperties } from '$lib/properties/delta';
import { writable } from 'svelte/store';
import '$lib/util/editor/resources';
import { QuillResource } from '$lib/util/editor/resources';
import type { ResourceObject } from '$lib/util/editor/resources';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageBucketError, UploadFileToBucketParams } from '$lib/util/types';
import type { NoteProperties } from '$lib/properties/note';
import { type ResourceProperties } from '$lib/properties/resource';

export const savingDeltaWritable = writable<boolean>(false);

export interface Comment {
	id: string;
	comment: string;
	author: string;
	timestamp: string;
}

export interface Resource {
	id: string;
	resource: ResourceObject;
	author: string;
	timestamp: string;
}

export interface QuillOptions extends QuillOptionsStatic {
	reader?: boolean;
}

export class QuillEditor extends Quill {
	comments: { [key: string]: Comment } = {};
	resources: { [key: string]: Resource } = {};
	resourcesData: HydratedDocument<ResourceProperties>[] = [];
	selectedDelta: Delta | undefined = undefined;
	selectedRange: { index: number; length: number } | undefined | null = undefined;
	oldSelectedRange: { index: number; length: number } | undefined | null = undefined;
	ops: Op[] | undefined;
	page: Page;
	chapters: { [key: string]: HydratedDocument<ChapterProperties> };
	/** True when saving delta to the server */
	savingDelta = false;
	/**
	 * Track changes which can be saved on the server
	 * Should only be changed through the store NOT directly
	 */
	changeDelta = new Delta();
	changeDeltaSnapshot: Delta | undefined;

	quillObject = this;
	reader = false;

	constructor(
		container: string | Element,
		chapters: { [key: string]: HydratedDocument<ChapterProperties> },
		page: Page,
		options?: QuillOptions
	) {
		super(container, options);
		Quill.register('modules/resource', QuillResource);
		this.chapters = chapters;
		this.page = page;
		savingDeltaWritable.subscribe((savingDelta) => {
			this.savingDelta = savingDelta;
		});
		if (options?.reader) {
			this.reader = true;
			this.disable();
		}
	}

	saveDelta(chapterId: string) {
		if (!this.changeDelta || this.changeDelta.length() == 0) {
			return;
		}

		if (this.savingDelta) {
			return;
		}

		const chapter = this.chapters[chapterId];
		let deltaID: string;
		if (typeof chapter?.delta === 'string') {
			deltaID = chapter?.delta as string;
		} else {
			deltaID = (chapter?.delta as HydratedDocument<DeltaProperties>)._id;
		}

		// Stringify resource ops
		this.changeDelta.ops.forEach((op: Op) => {
			if (op.attributes && op.attributes.resource && typeof op.attributes.resource === 'object') {
				op.attributes.resource = JSON.stringify(op.attributes.resource as string);
			}
		});

		/**  take a snapshot of the current change delta state.
		 * On success:
		 *	Merge the chapter delta with the snapshot.
		 *	The accrued changes are already in the new change delta created before sending to the server
		 * On fail:
		 * 	Merge the change delta snapshot to the existing change delta
		 */
		this.changeDeltaSnapshot = new Delta(this.changeDelta.ops);
		this.changeDelta = new Delta();
		savingDeltaWritable.update(() => true);

		trpc(this.page)
			.deltas.update.mutate({
				id: deltaID,
				chapterID: chapter!._id,
				ops: JSON.stringify(this.changeDeltaSnapshot.ops)
			})
			.then(async (result) => {
				const data = result.data as HydratedDocument<ChapterProperties>;

				data.delta;
				// Update the content to be one delta
				this.updateChapterContent(data._id);
			})
			.catch((e) => {
				// Merge snapshot and change deltas
				this.changeDelta = this.changeDeltaSnapshot!.compose(this.changeDelta);
			})
			.finally(() => {
				savingDeltaWritable.update(() => false);
			});
	}

	/**
	 * Merges the changeDeltaSnapshot with the local running delta
	 * This makes the local delta the same as the server delta
	 */
	updateChapterContent(chapterId: string) {
		const chapter = this.chapters[chapterId];
		const delta = chapter!.delta as HydratedDocument<DeltaProperties>;
		let chapterContentDelta: Delta = new Delta();

		if (!delta) {
			return;
		}

		const ops = delta.ops;

		chapterContentDelta = new Delta(ops as Op[]);

		// now update the content
		const composedDelta = chapterContentDelta.compose(this.changeDeltaSnapshot!);
		delta.ops = composedDelta.ops;
	}

	async getChapterNotes(chapterId: string): Promise<HydratedDocument<ChapterProperties>> {
		const chapter = this.chapters[chapterId];
		await trpc(this.page)
			.notes.getByChapterID.query({
				chapterID: chapter?._id
			})
			.then((response) => {
				const chapterNotes = response.data as HydratedDocument<NoteProperties>[];
				chapter!.chapterNotes = chapterNotes;
			});

		return chapter!;
	}

	async getChapterDelta(chapterId: string): Promise<HydratedDocument<ChapterProperties>> {
		const chapter = this.chapters[chapterId];
		const delta = chapter!.delta;

		this.disable();

		if (!chapter?.userPermissions?.view) {
			return chapter!;
		}

		if (delta) {
			if (typeof delta === 'string') {
				const deltaResponse = await trpc(this.page).deltas.getById.query({
					id: delta as string
				});
				console.log('** got delta');
				console.log(deltaResponse.data);
				this.setChapterContents(
					chapter!,
					deltaResponse.data as HydratedDocument<ChapterProperties>
				);
			} else {
				this.setChapterContents(chapter!, delta as HydratedDocument<ChapterProperties>);
			}
		} else {
			await trpc(this.page)
				.deltas.create.mutate({
					chapterID: chapter!._id
				})
				.then((deltaResponse) => {
					this.setChapterContents(
						chapter!,
						deltaResponse.data as HydratedDocument<ChapterProperties>
					);
				});
		}

		return chapter!;
	}

	/**
	 * Sets the delta contents of a chapter response on the quill element
	 * @param deltaResponse
	 * @returns
	 */
	setChapterContents(
		chapter: HydratedDocument<ChapterProperties>,
		deltaResponse: HydratedDocument<DeltaProperties>
	) {
		chapter.delta = deltaResponse;

		const opsJSON = (deltaResponse as HydratedDocument<DeltaProperties>).ops;
		const ops = opsJSON ? opsJSON : [];

		//Parse the resources to JavaScript objects
		(ops as Op[]).forEach((op) => {
			if (op.attributes && op.attributes.resource && typeof op.attributes.resource === 'string') {
				op.attributes.resource = JSON.parse(op.attributes.resource as string);
			}
		});
		this.setContents(new Delta(ops as Op[]));

		this.on('selection-change', this.selectionChange.bind(this));
		this.on('text-change', this.textChange.bind(this));

		if (chapter?.userPermissions?.collaborate && !chapter?.archived) {
			this.reader ? this.disable() : this.enable();
		}
	}

	/**
	 * Set contents renders the Delta on our quill editor
	 * We override and setup the comments after the super class call
	 * @param delta
	 * @param source
	 * @returns
	 */
	override setContents(delta: Delta, source?: Sources | undefined): Delta {
		const resultDelta: Delta = super.setContents(delta, source);
		this.intializeComments(delta);
		this.initializeResources(delta);
		return resultDelta;
	}

	/**
	 * Check if the selection is a comment or resource
	 * If it's a comment, focus on the comment element in the UI
	 * If it's an resource, focus on the resource element in the UI
	 * @param range
	 * @param oldRange
	 * @param source
	 * @returns
	 */
	selectionChange(
		range: { index: number; length: number },
		oldRange: { index: number; length: number },
		source: string
	) {
		if (!range) {
			return;
		}

		const delta = this.getContents(range.index, 1);
		this.oldSelectedRange = oldRange;
		this.selectedRange = range;
		this.selectedDelta = delta;

		if (!this.isComment(delta.ops[0]) && !this.isResource(delta.ops[0])) {
			return;
		}

		if (delta.ops[0].attributes?.commentId) {
			const commentId = delta.ops[0].attributes?.commentId;
			if (!(commentId in this.comments)) {
				return;
			}
			// get the container with all the comments
			const comments = document.getElementById('comments-container');
			// focus on the textarea. it has the id of the comment
			(comments?.querySelector(('#' + commentId).toString()) as HTMLElement).focus();
		} else if (delta.ops[0].attributes?.resourceId) {
			const resourceId = delta.ops[0].attributes?.resourceId;
			if (!(resourceId in this.resources)) {
				return;
			}
			// get the container with all the resource
			const resources = document.getElementById('resources-container');
			// focus on the caption input. id = "caption-" + resourceId
			(resources?.querySelector(('#caption-' + resourceId).toString()) as HTMLElement).focus();
		}
	}

	/**
	 * Checks whether the history has changed and updates the chapter deltas
	 * 1. Double maxStack when its about to fill up
	 * 2. Update the chapter's deltas to be the history stack's one
	 */

	textChange(delta: Delta) {
		if (!this.isEnabled()) {
			return;
		}

		this.changeDelta = this.changeDelta.compose(delta);

		// check if new comment was added
		const added: {
			comment: boolean;
			resource: boolean;
		} = this.delta(delta);
		if (added.comment) {
			// eslint-disable-next-line no-self-assign
			this.comments = this.comments;
		}
		if (added.resource) {
			// eslint-disable-next-line no-self-assign
			this.resources = this.resources;
		}
	}

	intializeComments(delta: Delta) {
		this.ops = delta.ops;

		if (!this.ops) {
			return;
		}

		this.ops.forEach((op) => {
			this.addComment(op);
		});
	}

	initializeResources(delta: Delta) {
		this.ops = delta.ops;

		if (!this.ops) {
			return;
		}

		this.ops.forEach((op) => {
			this.addIResource(op);
		});

		// load the resources from the DB
		this.loadDBResources();
	}

	async loadDBResources() {
		// note: the Resource and ResourseObject types are different
		// get ResourceObjects

		if (!this.resources) return;

		const resources = Object.values(this.resources);
		const resourceObjects = resources.map((resource) => resource.resource);

		trpc(this.page)
			.resources.getByIds.query({
				ids: resourceObjects.map((resource) => resource.id)
			})
			.then(async (result) => {
				const data = result.data as HydratedDocument<ResourceProperties>[];

				// Update the content to be one delta
				this.resourcesData = data;
			});
	}

	delta(delta: Delta): {
		comment: boolean;
		resource: boolean;
	} {
		const ops = delta.ops;
		let commentAdded = false;
		let resourceAdded = false;

		ops.forEach((op) => {
			commentAdded = this.addComment(op);
			resourceAdded = this.addIResource(op);
		});

		return {
			comment: commentAdded,
			resource: resourceAdded
		};
	}

	/**
	 * returns true if the first character of the selected text contains a comment
	 *
	 * when adding a comment, each letter of the selection contains an attribute for the comment
	 */
	selectedContainsComment(): boolean {
		return (
			this.selectedDelta &&
			this.selectedDelta.ops &&
			this.selectedDelta.ops[0].attributes &&
			this.selectedDelta.ops[0].attributes.commentId
		);
	}

	/**
	 * returns true if the first character of the selected text contains an resource
	 * when adding an resource, each letter of the selection contains an attribute for the resource
	 */
	selectedContainsResource(): boolean {
		return (
			this.selectedDelta &&
			this.selectedDelta.ops &&
			this.selectedDelta.ops[0].attributes &&
			this.selectedDelta.ops[0].attributes.resourceId
		);
	}

	addComment(op: Op): boolean {
		if (!this.isComment(op)) {
			return false;
		}

		if (this.selectedContainsComment()) {
			return false; //comment already exists on this selection
		}

		const comment: Comment = {
			id: op?.attributes?.commentId,
			comment: op?.attributes?.comment,
			author: op?.attributes?.commentAuthor,
			timestamp: op?.attributes?.commentTimestamp
		};

		this.comments[comment.id] = comment;
		return true;
	}

	addIResource(op: Op): boolean {
		if (!this.isResource(op)) {
			return false;
		}

		if (this.selectedContainsResource()) {
			return false; //resource already exists on this selection
		}

		const defaultResource: ResourceObject = {
			id: '',
			alt: '',
			title: '',
			src: ''
		};

		const resource: Resource = {
			id: op?.attributes?.resourceId,
			resource: op?.attributes?.resource || defaultResource,
			author: op?.attributes?.commentAuthor,
			timestamp: op?.attributes?.commentTimestamp
		};

		this.resources[resource.id] = resource;
		return true;
	}

	isComment(op: Op): boolean {
		if (!op.attributes) {
			return false;
		}

		if (!op.attributes['commentId']) {
			return false;
		}

		return true;
	}

	isResource(op: Op): boolean {
		if (!op.attributes) {
			return false;
		}

		if (!op.attributes['resourceId']) {
			return false;
		}

		return true;
	}

	updateComment(id: string, editor: HTMLElement | null, comment: string) {
		if (editor == null) {
			return;
		}

		const [index, length] = this.getRangeByID(id);

		if (index === null || length === null) {
			return;
		}

		const delta = this.formatText(index, length, 'comment', comment, 'user');
		return delta;
	}

	addResource(selectedChapterID: string) {
		if (this.oldSelectedRange === this.selectedRange) {
			return; // same range is selected
		}

		if (!this.selectedContainsComment() && !this.selectedContainsResource()) {
			// create the resource
			trpc(this.page)
				.resources.create.mutate({ type: 'image', chapterID: selectedChapterID })
				.then((response) => {
					if (response.success) {
						this.getModule('resource').addResource({
							id: (response.data as HydratedDocument<ResourceProperties>)._id,
							src: '',
							alt: '',
							title: ''
						});
						this.oldSelectedRange = this.selectedRange; // update the old selected range
					}
				});
		}
	}

	updateResource(
		id: string,
		editor: HTMLElement | null,
		resource: HydratedDocument<ResourceProperties>
	) {
		if (editor == null) {
			return;
		}

		const [index, length] = this.getRangeByID(id);

		if (index === null || length === null) {
			return;
		}

		// update the db resource first then the quill object
		trpc(this.page)
			.resources.update.mutate({
				id: resource.id,
				title: resource.title,
				src: resource.src,
				alt: resource.alt
			})
			.then((response) => {
				if (response.success) {
					const resourceObject: ResourceObject = {
						id: resource.id,
						title: resource.title ?? '',
						src: resource.src ?? '',
						alt: resource.alt ?? ''
					};
					this.formatText(index, length, 'resource', JSON.stringify(resourceObject), 'user');
				}
			});
	}

	removeComment(id: string, editor: HTMLElement | null) {
		if (editor == null) {
			return;
		}

		const [index, length] = this.getRangeByID(id);

		if (index === null || length === null) {
			return;
		}
		this.formatText(index, length, 'comment', false);
		this.formatText(index, length, 'commentAuthor', false);
		this.formatText(index, length, 'commentTimestamp', false);
		this.formatText(index, length, 'commentId', false);

		delete this.comments[id];
	}

	async removeResource({
		id,
		editor,
		supabase,
		filenames
	}: {
		id: string;
		editor: HTMLElement | null;
		supabase: SupabaseClient | null | undefined;
		filenames: string[] | null | undefined;
	}) {
		if (editor == null) {
			return { data: null, error: null };
		}

		const [index, length] = this.getRangeByID(id);

		if (index === null || length === null) {
			return { data: null, error: null };
		}

		this.formatText(index, length, 'resource', false);
		this.formatText(index, length, 'resourceAuthor', false);
		this.formatText(index, length, 'resourceTimestamp', false);
		this.formatText(index, length, 'resourceId', false);

		delete this.resources[id];

		if (supabase && filenames) {
			return await supabase.storage.from('books').remove(filenames);
		}
	}

	getComments(): { [key: string]: Comment } {
		return this.comments;
	}

	/**
	 * Gets the range of the element with specified ID from the editor
	 * @param id
	 */
	getRangeByID(id: string): [number | null, number | null] {
		const element = document.getElementById(id);

		if (!element) {
			return [null, null];
		}

		const blot = Quill.find(element);
		const index = blot.offset(this.scroll);
		const length = blot.length();

		return [index, length];
	}

	/**
	 * Attempts to upload a file to the specified bucket
	 * @param supabase Supabase client
	 * @param file File to upload
	 * @param bucket Bucket to upload to
	 * @param newFileName Optional new file name
	 */
	async uploadFileToBucket({ supabase, file, bucket, newFileName }: UploadFileToBucketParams) {
		return await supabase.storage.from(bucket).upload(newFileName || file.name, file);
	}

	getSupabaseFileURL({
		supabase,
		bucket,
		responsePath
	}: {
		supabase: SupabaseClient;
		bucket: string;
		responsePath: string;
	}) {
		let url = supabase.storage.from(bucket).getPublicUrl(responsePath).data.publicUrl;

		// for some reason, the public url needs to be cleaned
		// it does not add the folder paths correctly
		url =
			url.substring(0, url.indexOf(bucket)) +
			bucket +
			'/' +
			url.substring(url.lastIndexOf('/') + 1);

		return url;
	}

	/**
	 * Creates a new bucket if the specified bucket does not exist
	 * @param supabase
	 * @param errorCallback
	 * @param bucket
	 */
	async createResourceBucket({
		supabase,
		errorCallback,
		bucket
	}: {
		supabase: SupabaseClient;
		errorCallback: () => void;
		bucket: string;
	}) {
		//check if bucket exists
		supabase.storage
			.getBucket(bucket.substring(0, bucket.indexOf('/')) || 'books')
			.then((response: StorageBucketError) => {
				if (response.error || !response.data) {
					// bucket not found, create bucket first
					return supabase.storage.createBucket(bucket, {
						public: false,
						allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg'],
						fileSizeLimit: 1024
					});
				}
			})
			.catch(() => {
				errorCallback();
			});
	}
}
