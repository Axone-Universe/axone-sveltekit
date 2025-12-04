import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import type { PermissionProperties } from '$lib/properties/permission';

export abstract class DocumentBuilder<T> {
	abstract build(): Promise<T>;

	permissions(
		permissions:
			| Record<string, HydratedDocument<PermissionProperties>>
			| Map<string, HydratedDocument<PermissionProperties>>
	) {
		// Handle Map type
		if (permissions instanceof Map) {
			for (const [key, permission] of permissions.entries()) {
				if (permission && (!permission._id || permission._id === '')) {
					permissions.set(key, {
						...permission,
						_id: ulid()
					} as HydratedDocument<PermissionProperties>);
				}
			}
		} else {
			// Handle regular object (Record)
			for (const [key, permission] of Object.entries(permissions)) {
				if (permission && (!permission._id || permission._id === '')) {
					permissions[key] = {
						...permission,
						_id: ulid()
					} as HydratedDocument<PermissionProperties>;
				}
			}
		}
	}
}
