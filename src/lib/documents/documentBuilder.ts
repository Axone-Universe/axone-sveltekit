import { ulid } from 'ulid';
import type { HydratedDocument } from 'mongoose';
import type { PermissionProperties } from '$lib/properties/permission';

export abstract class DocumentBuilder<T> {
	abstract build(): Promise<T>;

	permissions(permissions: Record<string, HydratedDocument<PermissionProperties>>) {
		for (const [key, permission] of Object.entries(permissions)) {
			if (!permission._id || permission._id === '') {
				permissions[key] = {
					...permission,
					_id: ulid()
				} as HydratedDocument<PermissionProperties>;
			}
		}
	}
}
