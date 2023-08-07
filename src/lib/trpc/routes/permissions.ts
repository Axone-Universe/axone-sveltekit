import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { update, create } from '$lib/trpc/schemas/permissions';
import { PermissionBuilder } from '$lib/documents/digital-assets/permission';

export const permissions = t.router({
	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const permissionBuilder = new PermissionBuilder()
				.sessionUserID(ctx.session!.user.id)
				.documentID(input.documentID)
				.documentType(input.documentType)
				.permission(input.permission);

			if (input?.user) permissionBuilder.user(input.user);
			if (input?.public) permissionBuilder.public(input.public);

			const permissionNodeResponse = await permissionBuilder.build();

			return permissionNodeResponse;
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const permissionsBuilder = new PermissionBuilder(input._id)
				.sessionUserID(ctx.session!.user.id)
				.documentID(input.documentID)
				.documentType(input.documentType);

			const response = await permissionsBuilder.delete();
			return response;
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const permissionsBuilder = new PermissionBuilder(input._id)
				.sessionUserID(ctx.session!.user.id)
				.documentID(input.documentID)
				.documentType(input.documentType);

			if (input.permission) permissionsBuilder.permission(input.permission);

			const response = await permissionsBuilder.update();
			return response;
		})
});
