import { PermissionsEnum, type PermissionProperties } from '$lib/properties/permission';
import { Schema, type PipelineStage } from 'mongoose';
import { label as UserLabel } from '$lib/properties/user';

export const permissionSchema = new Schema<PermissionProperties>({
	_id: { type: String, required: true },
	user: { type: String, ref: UserLabel },
	permission: String
});

/**
 * @param userID - ID of user for the session
 * @param collection - The name of the collection that restricts access to this document e.g. storylines access is restricted by books
 * @param path - The name of the field referencing the collection
 * @param pipeline - The aggregate pipeline
 */
export function addPermissionsPipeline(userID: string, pipeline: PipelineStage[]) {
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
								{
									$ne: [{ $type: ['$permissions.' + userID + '.' + PermissionsEnum[1]] }, 'missing']
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

export function addRestrictionsPipeline(
	userID: string,
	pipeline: PipelineStage[],
	collection: string,
	path: string
) {
	// permissions
	pipeline.push(
		{
			$lookup: {
				from: collection,
				localField: path,
				foreignField: '_id',
				as: path
			}
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

export function addUpdatePermissionFilter(userID: string, filter: any) {
	let permissionFilter = {};

	// We'll only get books with public permissions
	permissionFilter = {
		$or: [
			{ user: userID },
			{
				['permissions.' + userID + '.permission']: 'edit'
			}
		]
	};

	const updatedFilter = { $and: [filter, permissionFilter] };

	return updatedFilter;
}

export function addDeletePermissionFilter(userID: string, filter: any) {
	let permissionFilter = {};

	if (!userID) {
		throw new Error('Unknown user requesting delete');
	}

	permissionFilter = { user: userID };

	const updatedFilter = { $and: [filter, permissionFilter] };

	return updatedFilter;
}
