import { z } from 'zod';
import { create as user } from './users';

import { PermissionedDocumentsEnum, PermissionsEnum } from '$lib/shared/permission';

export const update = z.object({
	_id: z.string(),
	documentID: z.string(),
	documentType: z.enum(PermissionedDocumentsEnum),
	permission: z.enum(PermissionsEnum).optional()
});

export const create = z.object({
	documentID: z.string(),
	documentType: z.enum(PermissionedDocumentsEnum),
	permission: z.enum(PermissionsEnum),
	public: z.boolean().optional(),
	user: z.string().optional()
});

export const permissions = z.object({
	_id: z.string(),
	public: z.boolean(),
	user: user.optional(),
	permission: z.enum(PermissionsEnum).optional()
});
