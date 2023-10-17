import {
	PermissionsEnum,
	type Permissions,
	type PermissionProperties,
	type PermissionedDocument
} from '$lib/properties/permission';
import { Schema, type PipelineStage, type HydratedDocument } from 'mongoose';
import { label as UserLabel } from '$lib/properties/user';
import { Book } from './book';
import type { BookProperties } from '$lib/properties/book';
import type { ChapterProperties } from '$lib/properties/chapter';
import type { StorylineProperties } from '$lib/properties/storyline';
import { Chapter } from './chapter';
import { Storyline } from './storyline';

export const permissionSchema = new Schema<PermissionProperties>({
	_id: { type: String, required: true },
	user: { type: String, ref: UserLabel },
	permission: String
});

/**
 * This method adds permissions that the session user has for the document
 * @param userID - ID of user for the session
 * @param collection - The name of the collection that restricts access to this document e.g. storylines access is restricted by books
 * @param path - The name of the field referencing the collection
 * @param pipeline - The aggregate pipeline
 */
export function addUserPermissionPipeline(userID: string, pipeline: PipelineStage[]) {
	pipeline.push(
		{
			$addFields: {
				permissionsArray: { $objectToArray: '$permissions' }
			}
		},
		{
			$lookup: {
				from: 'users',
				localField: 'permissionsArray.v.user',
				foreignField: '_id',
				as: 'permissionsUsers'
			}
		},
		{
			$unset: ['permissionsArray']
		}
	);

	pipeline.push({
		$addFields: {
			userPermissions: {
				[PermissionsEnum[0]]: {
					$cond: [
						{
							$or: [
								{ $eq: ['$user._id', userID] },
								{ $ne: [{ $type: ['$permissions.public'] }, 'missing'] },
								{ $ne: [{ $type: ['$permissions.' + userID] }, 'missing'] }
							]
						},
						true,
						false
					]
				},
				[PermissionsEnum[1]]: {
					$cond: [
						{
							$or: [
								{ $eq: ['$user._id', userID] },
								{ $eq: ['$permissions.public.permission', PermissionsEnum[1]] },
								{
									$eq: ['$permissions.' + userID + '.permission', PermissionsEnum[1]]
								}
							]
						},
						true,
						false
					]
				}
			}
		}
	});
}

/**
 * This method adds restrictions to the filter for a document query
 * Only users with viewing permissions will have the document returned
 * @param userID
 * @param pipeline
 * @param collection
 * @param path
 */
export function addReadRestrictionPipeline(
	userID: string,
	pipeline: PipelineStage[],
	collection: string,
	path: string,
	documentID?: string
) {
	let lookup: any;

	if (!documentID) {
		lookup = {
			from: collection,
			localField: path,
			foreignField: '_id',
			as: path
		};
	} else {
		lookup = {
			from: collection,
			let: { documentID: documentID },
			pipeline: [{ $match: { _id: documentID } }, { $limit: 1 }],
			as: path
		};
	}

	pipeline.push(
		{
			$lookup: lookup
		},
		{
			$unwind: {
				path: '$' + path,
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$match: {
				$or: [
					{ [path + '.user']: userID },
					{ [path + '.permissions.public']: { $exists: true } },
					{ [path + '.permissions.' + userID]: { $exists: true } }
				]
			}
		}
	);
}

/** READ, UPDATE, DELETE permission filters */

/**
 * This method adds restrictions for UPDATING a document
 * @param userID
 * @param filter
 * @returns
 */
export function addUpdateRestrictionPipeline(userID: string, filter: any) {
	let permissionFilter = {};

	if (!userID) {
		throw new Error('Unknown user requesting update');
	}

	permissionFilter = { user: userID };

	const updatedFilter = { $and: [filter, permissionFilter] };

	return updatedFilter;
}

export function addCollaborationRestrictionOnUpdate(userID: string, filter: any) {
	let permissionFilter = {};

	const collaborate: Permissions = 'collaborate';

	permissionFilter = {
		$or: [
			{ user: userID },
			{
				['permissions.public.permission']: collaborate
			},
			{
				['permissions.' + userID + '.permission']: collaborate
			}
		]
	};

	const updatedFilter = { $and: [filter, permissionFilter] };

	return updatedFilter;
}

/**
 * This method checks whether a user can collaborate on a document before SAVING it
 * e.g. Before saving a storyline, this check will run on the BOOK collection to check if user can collaborate on the book
 * This is the same relationship for storline & chapters, chapter & deltas
 * @param userID
 * @param collection
 * @param documentID
 */
export async function addCollaborationRestrictionOnSave(
	userID: string,
	collection: PermissionedDocument,
	documentID: string
) {
	const filter = [
		{
			$match: {
				_id: documentID
			}
		}
	];
	const options = {
		userID: userID
	};

	let document!:
		| HydratedDocument<BookProperties>
		| HydratedDocument<ChapterProperties>
		| HydratedDocument<StorylineProperties>;

	switch (collection) {
		case 'Book':
			document = await Book.aggregate(filter, options).cursor().next();
			break;

		case 'Storyline':
			document = await Storyline.aggregate(filter, options).cursor().next();
			break;

		case 'Chapter':
			document = await Chapter.aggregate(filter, options).cursor().next();
			break;

		default:
			break;
	}

	if (document && !document.userPermissions?.collaborate) {
		throw new Error('You have no permission to collaborate on this document');
	}
}
