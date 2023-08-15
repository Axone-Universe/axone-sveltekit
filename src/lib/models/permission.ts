import type { PermissionProperties } from '$lib/shared/permission';
import { Schema } from 'mongoose';
import { label as UserLabel } from '$lib/shared/user';

export const permissionSchema = new Schema<PermissionProperties>({
	_id: { type: String, required: true },
	public: { type: Boolean, required: true },
	user: { type: String, ref: UserLabel },
	permission: String
});

/** READ, UPDATE, DELETE permission filters */

export function addUpdatePermissionFilter(userID: string, filter: any) {
	let permissionFilter = {};

	// We'll only get books with public permissions
	if (!userID) {
		permissionFilter = { permissions: { $elemMatch: { public: true, permission: 'edit' } } };
	} else {
		permissionFilter = {
			$or: [
				{ user: userID },
				{
					permissions: {
						$elemMatch: { $or: [{ public: true }, { user: userID, permission: 'edit' }] }
					}
				}
			]
		};
	}

	const updatedFilter = { $and: [filter, permissionFilter] };

	return updatedFilter;
}

export function addReadPermissionFilter(userID: string, filter: any) {
	let permissionFilter = {};

	// We'll only get books with public permissions
	if (!userID) {
		permissionFilter = { permissions: { $elemMatch: { public: true } } };
	} else {
		permissionFilter = {
			$or: [
				{ user: userID },
				{ permissions: { $elemMatch: { $or: [{ public: true }, { user: userID }] } } }
			]
		};
	}

	const updatedFilter = { $and: [filter, permissionFilter] };

	return updatedFilter;
}

export function addDeletePermissionFilter(userID: string, filter: any) {
	let permissionFilter = {};

	// We'll only get books with public permissions
	if (!userID) {
		throw new Error('Unknown user requesting delete');
	}

	permissionFilter = { user: userID };

	const updatedFilter = { $and: [filter, permissionFilter] };

	return updatedFilter;
}
