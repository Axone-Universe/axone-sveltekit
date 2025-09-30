import {
	PermissionsEnum,
	type Permissions,
	type PermissionProperties
} from '$lib/properties/permission';
import { Schema, type PipelineStage } from 'mongoose';
import { label as UserLabel, UserProperties } from '$lib/properties/user';

export const permissionSchema = new Schema<PermissionProperties>({
	_id: { type: String, required: true },
	user: { type: String, ref: UserLabel },
	permission: String
});

/**
 * This method adds permissions that the session user has for the document to the result of the aggregate pipeline
 * @param user - user object for the session
 * @param collection - The name of the collection that restricts access to this document e.g. storylines access is restricted by books
 * @param path - The name of the field referencing the collection
 * @param pipeline - The aggregate pipeline
 */
export function addUserPermissionPipeline(user: UserProperties, pipeline: PipelineStage[]) {
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

	// console.log('** permissions push ', user);
	pipeline.push({
		$addFields: {
			userPermissions: {
				[PermissionsEnum[0]]: user.admin
					? true
					: {
							$cond: [
								{
									$or: [
										{ $eq: ['$user._id', user._id] },
										{ $ne: [{ $type: ['$permissions.public'] }, 'missing'] },
										{ $ne: [{ $type: ['$permissions.' + user._id] }, 'missing'] }
									]
								},
								true,
								false
							]
					  },
				[PermissionsEnum[1]]: user.admin
					? true
					: {
							$cond: [
								{
									$or: [
										{ $eq: ['$user._id', user._id] },
										{ $eq: ['$permissions.public.permission', PermissionsEnum[1]] },
										{
											$eq: ['$permissions.' + user._id + '.permission', PermissionsEnum[1]]
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
	user: UserProperties,
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
					...(user.admin ? [{}] : []),
					{ [path + '.user']: user._id },
					{ [path + '.permissions.public']: { $exists: true } },
					{ [path + '.permissions.' + user._id]: { $exists: true } }
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
export function addOwnerUpdateRestrictionFilter(user: UserProperties, filter: any) {
	if (!user) {
		throw new Error('Unknown user requesting update');
	}

	let permissionFilter = {};
	permissionFilter = {
		$or: [...(user.admin ? [{}] : []), { user: user._id }]
	};

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
export function addCollaboratorUpdateRestrictionFilter(user: UserProperties, filter: any) {
	let permissionFilter = {};

	const collaborate: Permissions = 'collaborate';

	permissionFilter = {
		$or: [
			...(user.admin ? [{}] : []),
			{ user: user._id },
			{
				['permissions.public.permission']: collaborate
			},
			{
				['permissions.' + user._id + '.permission']: collaborate
			}
		]
	};

	const updatedFilter = { $and: [filter, permissionFilter] };

	return updatedFilter;
}

export function setUpdateDate(update: any) {
	if (update) {
		if (update.$set) {
			update.$set.updatedAt = new Date();
		} else {
			update.$set = { updatedAt: new Date() };
		}
	}

	return update;
}
