import type Delta from 'quill-delta';
import type Op from 'quill-delta/dist/Op';
import type Quill from 'quill';

export interface Comment {
	id: string;
	comment: string;
	author: string;
	timestamp: string;
}

export class QuillEditor {
	comments: { [key: string]: Comment } = {};
	ops: Op[] | undefined;

	constructor(ops?: Op[]) {
		this.ops = ops;
		this.intializeComments();
	}

	intializeComments() {
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

	updateComment(index: number | null, length: number | null, quill: Quill, comment: string) {
		if (index === null || length === null) {
			return;
		}
		const delta = quill.formatText(index, length, 'comment', comment, 'user');
		return delta;
	}

	removeComment(id: string, index: number | null, length: number | null, quill: Quill) {
		if (index === null || length === null) {
			return;
		}
		quill.formatText(index, length, 'comment', false);
		quill.formatText(index, length, 'commentAuthor', false);
		quill.formatText(index, length, 'commentTimestamp', false);
		quill.formatText(index, length, 'commentId', false);

		delete this.comments[id];
	}

	getComments(): { [key: string]: Comment } {
		return this.comments;
	}
}
