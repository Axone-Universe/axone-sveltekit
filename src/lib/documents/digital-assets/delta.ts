import { ulid } from 'ulid';
import QuillDelta from 'quill-delta';
import type { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import type { DeltaProperties } from '$lib/properties/delta';
import { Delta } from '$lib/models/delta';
import { Chapter } from '$lib/models/chapter';

export class DeltaBuilder extends DocumentBuilder<HydratedDocument<DeltaProperties>> {
	private _chapterID?: string;
	private _sessionUserID?: string;
	private readonly _deltaProperties: DeltaProperties;

	constructor(id?: string) {
		super();
		this._deltaProperties = {
			_id: id ? id : ulid(),
			versions: []
		};
	}

	chapterID(chapterID: string): DeltaBuilder {
		this._chapterID = chapterID;
		this._deltaProperties.chapter = chapterID;
		return this;
	}

	ops(ops: string): DeltaBuilder {
		const opsJSON = JSON.parse(ops);
		this._deltaProperties.versions = opsJSON;
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
	async delta(ops: string) {
		const deltaOps = JSON.parse(ops);
		const quillDelta = new QuillDelta(deltaOps);

		const delta = await Delta.aggregate(
			[
				{
					$match: {
						_id: this._deltaProperties._id
					}
				}
			],
			{
				userID: this._sessionUserID
			}
		)
			.cursor()
			.next();

		let currentVersion = delta.versions.pop();
		if (!currentVersion) {
			currentVersion = { date: this.formatDate(new Date()), ops: [] };
		}

		const currentOpsJSON = currentVersion.ops;

		// convert current ops to a delta
		const currentOps = currentOpsJSON ? currentOpsJSON : [];
		const currentQuillDelta = new QuillDelta(currentOps);

		// merge the 2 deltas
		const newQuillDelta = currentQuillDelta.compose(quillDelta);
		currentVersion.ops = newQuillDelta.ops;

		delta.versions.push(currentVersion);

		this._deltaProperties.versions = delta.versions;
		return this;
	}

	async createVersion() {
		const delta = await Delta.aggregate(
			[
				{
					$match: {
						_id: this._deltaProperties._id
					}
				}
			],
			{
				userID: this._sessionUserID
			}
		)
			.cursor()
			.next();

		delta.versions.push([]);

		this._deltaProperties.versions = delta.versions;
		return this;
	}

	formatDate(date: Date) {
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric'
		});
	}

	async update(): Promise<HydratedDocument<DeltaProperties>> {
		if (!this._deltaProperties._id) throw new Error('Must provide a deltaID to update the delta.');

		await Delta.findOneAndUpdate({ _id: this._deltaProperties._id }, this._deltaProperties, {
			new: true
			// userID: this._sessionUserID
		});

		const delta = await Delta.aggregate(
			[
				{
					$match: {
						_id: this._deltaProperties._id
					}
				}
			],
			{
				userID: this._sessionUserID
			}
		)
			.cursor()
			.next();

		return delta;
	}

	async build(): Promise<HydratedDocument<DeltaProperties>> {
		if (!this._chapterID) throw new Error('Must provide a chapterID to build the delta.');

		const session = await mongoose.startSession();

		try {
			// use a transaction to make sure everything saves
			await session.withTransaction(async () => {
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

				this._deltaProperties.permissions = chapter.permissions;

				const delta = new Delta(this._deltaProperties);
				await delta.save({ session });

				chapter.delta = delta._id;
				await Chapter.findOneAndUpdate({ _id: chapter._id }, chapter, {
					userID: this._sessionUserID,
					session: session
				});

				return delta;
			});
		} finally {
			session.endSession();
		}

		const newDelta = await Delta.aggregate(
			[
				{
					$match: {
						_id: this._deltaProperties._id
					}
				}
			],
			{
				userID: this._sessionUserID
			}
		)
			.cursor()
			.next();

		return newDelta;
	}
}
