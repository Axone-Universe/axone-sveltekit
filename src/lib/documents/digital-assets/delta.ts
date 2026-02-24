import { ulid } from 'ulid';
import QuillDelta from 'quill-delta';
import type { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import { VERSION_OP_LENGTH } from '$env/static/private';

import {
	VersionPropertyBuilder,
	type DeltaProperties,
	type VersionProperties
} from '$lib/properties/delta';
import { Delta } from '$lib/models/delta';
import { Chapter } from '$lib/models/chapter';
import type Op from 'quill-delta/dist/Op';
import type { PermissionProperties } from '$lib/properties/permission';
import type { UserProperties } from '$lib/properties/user';

export class DeltaBuilder extends DocumentBuilder<HydratedDocument<DeltaProperties>> {
	private _chapterID?: string;
	private _sessionUser?: UserProperties;
	private readonly _deltaProperties: DeltaProperties;

	constructor(id?: string) {
		super();
		this._deltaProperties = {
			_id: id ? id : ulid(),
			versions: [new VersionPropertyBuilder().getProperties()],
			updatedAt: new Date()
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

	permissions(permissions: Record<string, HydratedDocument<PermissionProperties>>) {
		super.permissions(permissions);
		this._deltaProperties.permissions = permissions;
		return this;
	}

	userID(userID: string): DeltaBuilder {
		this._deltaProperties.user = userID;
		return this;
	}

	properties() {
		return this._deltaProperties;
	}

	sessionUser(sessionUser: UserProperties): DeltaBuilder {
		this._sessionUser = sessionUser;
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
				user: this._sessionUser
			}
		)
			.cursor()
			.next();

		const currentVersion = delta.versions.pop();
		const currentOpsJSON = currentVersion.ops;

		// convert current ops to a delta
		const currentOps = currentOpsJSON ? currentOpsJSON : [];
		const currentQuillDelta = new QuillDelta(currentOps);

		// merge the 2 deltas
		const newQuillDelta = currentQuillDelta.compose(quillDelta);
		currentVersion.ops = newQuillDelta.ops;

		delta.versions.push(currentVersion);

		// create new version if length of current is big enough
		// a paragraph is between 500 and 1000 characters for a novel
		const deltaLength = newQuillDelta.length();

		if (deltaLength > parseInt(VERSION_OP_LENGTH)) {
			this.createVersion(undefined, delta);
		}

		this._deltaProperties.versions = delta.versions;
		return this;
	}

	async createVersion(title?: string, delta?: HydratedDocument<DeltaProperties>) {
		delta =
			delta ??
			(await Delta.aggregate(
				[
					{
						$match: {
							_id: this._deltaProperties._id
						}
					}
				],
				{
					user: this._sessionUser
				}
			)
				.cursor()
				.next());

		const currentVersion = delta?.versions?.at(-1);
		if (currentVersion && currentVersion.ops.length === 0) {
			throw new Error('Error: The version is empty');
		}

		const newVersion = new VersionPropertyBuilder().getProperties();

		// creating a version means freezing the current version at that date and point and creating a new one
		currentVersion!.title = title;
		currentVersion!.date = newVersion.date;

		delta?.versions?.push(newVersion);

		this._deltaProperties.versions = delta?.versions;
		return this;
	}

	async restoreVersion(versionID: string) {
		const delta = await Delta.aggregate(
			[
				{
					$match: {
						_id: this._deltaProperties._id
					}
				}
			],
			{
				user: this._sessionUser
			}
		)
			.cursor()
			.next();

		const {
			diffDelta: diffQuillDelta,
			versionDelta: versionQuillDelta,
			version: restoredVersion
		} = this.getDiffDelta(delta.versions, versionID);

		// Create the inverting delta
		// When applied to the current version, the inverting delta will revert to the specified version.
		const inversion = diffQuillDelta.invert(versionQuillDelta);

		const version = new VersionPropertyBuilder().getProperties();
		version.title = 'Restored from ' + restoredVersion?.date;
		version.ops = inversion.ops;

		delta.versions.push(version);

		this._deltaProperties.versions = delta.versions;
		return this;
	}

	/**
	 * 1. Gets ops from delta initiation up to
	 * @param versions
	 * @param versionID
	 * @returns
	 */
	getDiffDelta(versions: VersionProperties[], versionID: string) {
		let diffDelta = new QuillDelta();
		let versionDelta = new QuillDelta();

		let composeVersionDelta = true;
		let version;
		for (const deltaVersion of versions) {
			if (composeVersionDelta) {
				const delta = new QuillDelta(deltaVersion.ops as Op[]);
				versionDelta = versionDelta.compose(delta);
			} else {
				const delta = new QuillDelta(deltaVersion.ops as Op[]);
				diffDelta = diffDelta.compose(delta);
			}

			if (deltaVersion._id === versionID) {
				composeVersionDelta = false;
				version = deltaVersion;
			}
		}
		return { diffDelta, versionDelta, version } as const;
	}

	async update(): Promise<HydratedDocument<DeltaProperties>> {
		if (!this._deltaProperties._id) throw new Error('Must provide a deltaID to update the delta.');

		await Delta.findOneAndUpdate({ _id: this._deltaProperties._id }, this._deltaProperties, {
			new: true,
			user: this._sessionUser
		});

		const deltas = await Delta.aggregate(
			[
				{
					$match: {
						_id: this._deltaProperties._id
					}
				}
			],
			{
				user: this._sessionUser
			}
		).exec();

		// We don't user a cursor here so that the middleware for delta model is called.
		const delta = deltas[0];
		return delta;
	}

	async build(): Promise<HydratedDocument<DeltaProperties>> {
		if (!this._chapterID) throw new Error('Must provide a chapterID to build the delta.');
		if (!this._deltaProperties.user) throw new Error('Must provide a userID to build the delta.');

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
						user: this._sessionUser
					}
				)
					.cursor()
					.next();

				this._deltaProperties.permissions = chapter.permissions;

				const delta = new Delta(this._deltaProperties);
				await delta.save({ session });

				chapter.delta = delta._id;
				await Chapter.findOneAndUpdate({ _id: chapter._id }, chapter, {
					user: this._sessionUser,
					session: session
				});

				return delta;
			});
		} finally {
			session.endSession();
		}

		const newDeltas = await Delta.aggregate(
			[
				{
					$match: {
						_id: this._deltaProperties._id
					}
				}
			],
			{
				user: this._sessionUser
			}
		).exec();

		// We don't user a cursor here so that the middleware for delta model is called.
		const newDelta = newDeltas[0];
		return newDelta;
	}
}
