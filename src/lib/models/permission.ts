import {
	PermissionsEnum,
	type Permissions,
	type PermissionProperties
} from '$lib/properties/permission';
import { Schema, type PipelineStage } from 'mongoose';
import { label as UserLabel } from '$lib/properties/user';

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
 * It works by checking parent document permissions.
 * If the parent has viewing restrictions, the child documents will not be returned
 * The collection parameter is the parent document whose permissions will be checked
 * @param userID
 * @param pipeline
 * @param collection
 * @param path
 */
export function addViewRestrictionPipeline(
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
 * This method adds OWNER restrictions for UPDATING a document.
 * If it's not the owner updating, the document will not update
 * @param userID
 * @param filter
 * @returns
 */
export function addOwnerUpdateRestrictionFilter(userID: string, filter: any) {
	if (!userID) {
		throw new Error('Unknown user requesting update');
	}

	const permissionFilter = { user: userID };

	const updatedFilter = { $and: [filter, permissionFilter] };

	return updatedFilter;
}

/**
 * This method restricts ARCHIVED documents from being updated
 * @param userID
 * @param filter
 * @returns
 */
export function addArchivedRestrictionFilter(filter: any) {
	const archiveFilter = { $or: [{ archived: false }, { archived: { $exists: false } }] };

	const updatedFilter = { $and: [filter, archiveFilter] };

	return updatedFilter;
}

/**
 * This method adds COLLABORATOR restrictions for UPDATING a document.
 * If it's not a collaborator updating, the document will not update
 * e.g. deltas use this to check if the user has collaboration permissions
 * @param userID
 * @param filter
 * @returns
 */
export function addCollaboratorUpdateRestrictionFilter(userID: string, filter: any) {
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
