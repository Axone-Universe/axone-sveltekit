import type Delta from 'quill-delta';
import type Op from 'quill-delta/dist/Op';
import Quill, { type QuillOptionsStatic, type Sources } from 'quill';

export interface Comment {
	id: string;
	comment: string;
	author: string;
	timestamp: string;
}

export class QuillEditor extends Quill {
	comments: { [key: string]: Comment } = {};
	ops: Op[] | undefined;

	constructor(container: string | Element, options?: QuillOptionsStatic) {
		super(container, options);
	}

	override setContents(delta: Delta, source?: Sources | undefined): Delta {
		const resultDelta: Delta = super.setContents(delta, source);
		this.intializeComments(delta);
		return resultDelta;
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

	delta(delta: Delta): boolean {
		const ops = delta.ops;
		let commentAdded = false;

		ops.forEach((op) => {
			commentAdded = this.addComment(op);
		});

		return commentAdded;
	}

	addComment(op: Op): boolean {
		if (!this.isComment(op)) {
			return false;
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

	isComment(op: Op): boolean {
		if (!op.attributes) {
			return false;
		}

		if (!op.attributes['commentId']) {
			return false;
		}

		return true;
	}

	updateComment(id: string, editor: HTMLElement | null, comment: string) {
		if (editor == null) {
			return;
		}

		const [index, length] = this.getRangeByID(id, editor);

		if (index === null || length === null) {
			return;
		}

		const delta = this.formatText(index, length, 'comment', comment, 'user');
		return delta;
	}

	removeComment(id: string, editor: HTMLElement | null) {
		if (editor == null) {
			return;
		}

		const [index, length] = this.getRangeByID(id, editor);

		if (index === null || length === null) {
			return;
		}
		this.formatText(index, length, 'comment', false);
		this.formatText(index, length, 'commentAuthor', false);
		this.formatText(index, length, 'commentTimestamp', false);
		this.formatText(index, length, 'commentId', false);

		delete this.comments[id];
	}

	getComments(): { [key: string]: Comment } {
		return this.comments;
	}

	/**
	 * Gets the range of the element with specified ID from the editor
	 * @param id
	 */
	getRangeByID(id: string, editor: HTMLElement): [number | null, number | null] {
		const element = editor?.querySelector(('#' + id).toString());

		if (!element) {
			return [null, null];
		}

		const blot = Quill.find(element);
		const index = blot.offset(this.scroll);
		const length = blot.length();

		return [index, length];
	}
}
