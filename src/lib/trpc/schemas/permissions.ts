import { z } from 'zod';

import { PermissionedDocumentsEnum, PermissionsEnum } from '$lib/properties/permission';

export const create = z.object({
	documentID: z.string(),
	documentType: z.enum(PermissionedDocumentsEnum),
	permission: z.enum(PermissionsEnum),
	public: z.boolean().optional(),
	user: z.string().optional()
});

export const update = z.object({
	_id: z.string(),
	documentID: z.string(),
	documentType: z.enum(PermissionedDocumentsEnum),
	permission: z.enum(PermissionsEnum).optional()
});

export const permissions = z.object({
	_id: z.string(),
	user: z.any().optional(),
	permission: z.enum(PermissionsEnum).optional()
});
