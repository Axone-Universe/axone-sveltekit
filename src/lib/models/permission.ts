import type { PermissionProperties } from '$lib/shared/permission';
import { Schema } from 'mongoose';
import { label as UserLabel } from '$lib/shared/user';

export const permissionSchema = new Schema<PermissionProperties>({
	_id: { type: String, required: true },
	public: { type: Boolean, required: true },
	user: { type: String, ref: UserLabel },
	permission: String
});
