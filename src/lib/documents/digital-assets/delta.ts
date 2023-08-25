import { ulid } from 'ulid';
import QuillDelta from 'quill-delta';
import type { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import type { DeltaProperties } from '$lib/shared/delta';
import { Delta } from '$lib/models/delta';
import { Chapter } from '$lib/models/chapter';
import type { ChapterProperties } from '$lib/shared/chapter';

export class DeltaBuilder extends DocumentBuilder<HydratedDocument<DeltaProperties>> {
	private _chapterID?: string;
	private _sessionUserID?: string;
	private readonly _deltaProperties: DeltaProperties;

	constructor(id?: string) {
		super();
		this._deltaProperties = {
			_id: id ? id : ulid(),
			ops: []
		};
	}

	chapterID(chapterID: string): DeltaBuilder {
		this._chapterID = chapterID;
		this._deltaProperties.chapter = chapterID;
		return this;
	}

	ops(ops: string): DeltaBuilder {
		const opsJSON = JSON.parse(ops);
		this._deltaProperties.ops = opsJSON;
		return this;
	}

	sessionUserID(sessionUserID: string): DeltaBuilder {
		this._sessionUserID = sessionUserID;
		return this;
	}

	/**
	 * Mostly used for incremental autosaving
	 * @param delta
	 */
	async delta(id: string, ops: string) {
		const deltaOps = JSON.parse(ops);
		const quillDelta = new QuillDelta(deltaOps);

		const delta = await Delta.aggregate([
			{
				$match: {
					_id: id
				}
			}
		])
			.cursor()
			.next();

		const currentOpsJSON = delta.ops;

		// convert current ops to a delta
		const currentOps = currentOpsJSON ? currentOpsJSON : [];
		const currentQuillDelta = new QuillDelta(currentOps);

		// merge the 2 deltas
		const newQuillDelta = currentQuillDelta.compose(quillDelta);

		this._deltaProperties.ops = newQuillDelta.ops;
		return this;
	}

	async update(): Promise<HydratedDocument<DeltaProperties>> {
		if (!this._deltaProperties._id) throw new Error('Must provide a deltaID to update the delta.');

		const delta = await Delta.findOneAndUpdate(
			{ _id: this._deltaProperties._id },
			this._deltaProperties,
			{ new: true }
		);

		return delta;
	}

	async build(): Promise<HydratedDocument<DeltaProperties>> {
		if (!this._chapterID) throw new Error('Must provide a chapterID to build the delta.');

		const session = await mongoose.startSession();

		const delta = new Delta(this._deltaProperties);
		// use a transaction to make sure everything saves
		await session.withTransaction(async () => {
			await delta.save({ session });

			const chapter = await Chapter.aggregate(
				[
					{
						$match: {
							_id: this._chapterID
						}
					}
				],
				{
					userID: this._sessionUserID
				}
			)
				.cursor()
				.next();

			await Chapter.findOneAndUpdate({ _id: chapter._id }, chapter, {
				userID: this._sessionUserID,
				session: session
			});

			return delta;
		});

		return delta;
	}
}
