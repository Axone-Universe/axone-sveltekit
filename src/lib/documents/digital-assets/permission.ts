import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import type mongoose from 'mongoose';
import { DocumentBuilder } from '../documentBuilder';
import type { PermissionProperties, Permissions } from '$lib/properties/permission';
import { Chapter } from '$lib/models/chapter';
import { label as BookLabel, type BookProperties } from '$lib/properties/book';
import { label as ChapterLabel, type ChapterProperties } from '$lib/properties/chapter';
import { label as StorylineLabel, type StorylineProperties } from '$lib/properties/storyline';
import { Book } from '$lib/models/book';
import { Storyline } from '$lib/models/storyline';

export class PermissionBuilder extends DocumentBuilder<HydratedDocument<PermissionProperties>> {
	private _documentID?: string;
	private _documentType: string | undefined;
	private readonly _permissionProperties: PermissionProperties;
	private _sessionUserID?: string;

	constructor(id?: string) {
		super();
		this._permissionProperties = {
			_id: id ? id : ulid()
		};
	}

	documentID(chapterID: string) {
		this._documentID = chapterID;

		return this;
	}

	user(user: string): PermissionBuilder {
		this._permissionProperties.user = user;
		return this;
	}

	permissionSetterID(permissionSetterID: string): PermissionBuilder {
		this._sessionUserID = permissionSetterID;
		return this;
	}

	permission(permission: Permissions): PermissionBuilder {
		this._permissionProperties.permission = permission;
		return this;
	}

	documentType(documentType: string): PermissionBuilder {
		this._documentType = documentType;
		return this;
	}

	sessionUserID(sessionUserID: string): PermissionBuilder {
		this._sessionUserID = sessionUserID;
		return this;
	}

	async update(): Promise<HydratedDocument<PermissionProperties>> {
		if (!this._documentID) throw new Error('Must provide a documentID to update the permission.');
		if (!this._sessionUserID)
			throw new Error('Must provide a the permission setter to update the permission.');

		const document = await this.parentDocument();

		document.permissions.id(this._permissionProperties._id).permission =
			this._permissionProperties.permission;

		await document.save();

		return document!.permissions!.id(this._permissionProperties._id);
	}

	async delete(): Promise<mongoose.mongo.DeleteResult> {
		if (!this._documentID) throw new Error('Must provide a documentID to delete the permission.');
		if (!this._sessionUserID)
			throw new Error('Must provide a the permission setter to delete the permission.');

		const result = {};

		const document = await this.parentDocument();

		document.permissions.id(this._permissionProperties._id).deleteOne();
		await document?.save();

		return result as mongoose.mongo.DeleteResult;
	}

	async parentDocument() {
		let document: any;
		switch (this._documentType) {
			case BookLabel: {
				document = await Book.aggregate(
					[
						{
							$match: {
								_id: this._documentID
							}
						}
					],
					{
						userID: this._sessionUserID
					}
				)
					.cursor()
					.next();

				break;
			}
			case StorylineLabel: {
				document = await Storyline.aggregate(
					[
						{
							$match: {
								_id: this._documentID
							}
						}
					],
					{
						userID: this._sessionUserID
					}
				)
					.cursor()
					.next();

				break;
			}
			case ChapterLabel: {
				document = await Chapter.aggregate(
					[
						{
							$match: {
								_id: this._documentID
							}
						}
					],
					{
						userID: this._sessionUserID
					}
				)
					.cursor()
					.next();

				break;
			}
			default: {
				throw new Error('Document type not specified.');
			}
		}

		/** validate document */
		if (document === null) {
			throw new Error('Document for permission not found.');
		}

		const documentOwnerID = typeof document.user === 'string' ? document.user : document.user?._id;

		if (documentOwnerID !== this._sessionUserID) {
			throw new Error('Unauthorized to modify the permission.');
		}

		if (document.permissions === undefined) {
			throw new Error('Document has no permissions.');
		}

		return document;
	}

	async build(): Promise<HydratedDocument<PermissionProperties>> {
		if (!this._documentID) throw new Error('Must provide a documentID to build the permission.');
		if (!this._sessionUserID)
			throw new Error('Must provide a the permission setter to build the permission.');
		if (!this._documentType)
			throw new Error('Must provide a document type to build the permission.');

		const document = await this.parentDocument();

		document.permissions.push(this._permissionProperties);
		await document.save();

		return document.permissions.id(this._permissionProperties._id);
	}
}
