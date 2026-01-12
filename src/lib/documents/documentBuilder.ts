import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import type { PermissionProperties } from '$lib/properties/permission';

export abstract class DocumentBuilder<T> {
	abstract build(): Promise<T>;
	protected _permissions: Record<string, HydratedDocument<PermissionProperties>> = {};

	permissions(
		permissions:
			| Record<string, HydratedDocument<PermissionProperties>>
			| Map<string, HydratedDocument<PermissionProperties>>
	) {
		// Handle Map type
		if (permissions instanceof Map) {
			for (const [key, permission] of permissions.entries()) {
				this._permissions[key] = permission;
				if (permission && (!permission._id || permission._id === '')) {
					this._permissions[key] = {
						...permission,
						_id: ulid()
					} as HydratedDocument<PermissionProperties>;
				}
			}
		} else {
			// Handle regular object (Record)
			for (const [key, permission] of Object.entries(permissions)) {
				this._permissions[key] = permission as HydratedDocument<PermissionProperties>;

				if (permission && (!permission._id || permission._id === '')) {
					this._permissions[key] = {
						...permission,
						_id: ulid()
					} as HydratedDocument<PermissionProperties>;
				}
			}
		}
	}
}
