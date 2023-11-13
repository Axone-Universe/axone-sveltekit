import { auth } from '$lib/trpc/middleware/auth';
import { DeltasRepository } from '$lib/repositories/deltasRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { update, read, create, versions } from '$lib/trpc/schemas/deltas';
import { DeltaBuilder } from '$lib/documents/digital-assets/delta';
import type { Response } from '$lib/util/types';
import type { DeltaProperties } from '$lib/properties/delta';
import type { HydratedDocument } from 'mongoose';

export const deltas = t.router({
	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const deltaBuilder = new DeltaBuilder()
				.sessionUserID(ctx.session!.user.id)
				.userID(ctx.session!.user.id)
				.chapterID(input.chapterID);

			const response: Response = { success: true, message: 'delta successfully created', data: {} };
			try {
				const result = await deltaBuilder.build();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<DeltaProperties> } };
		}),

	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const deltasRepo = new DeltasRepository();

			const response: Response = {
				success: true,
				message: 'delta successfully retrieved',
				data: {}
			};
			try {
				const result = await deltasRepo.getById(ctx.session, input.id);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<DeltaProperties> } };
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const deltaBuilder = new DeltaBuilder(input.id)
				.sessionUserID(ctx.session!.user.id)
				.chapterID(input.chapterID);

			if (input.ops) {
				await deltaBuilder.delta(input.ops);
			}

			const response: Response = {
				success: true,
				message: 'delta successfully updated',
				data: {}
			};
			try {
				const result = await deltaBuilder.update();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<DeltaProperties> } };
		}),

	createVersion: t.procedure
		.use(logger)
		.use(auth)
		.input(versions)
		.mutation(async ({ input, ctx }) => {
			const deltaBuilder = new DeltaBuilder(input.id)
				.sessionUserID(ctx.session!.user.id)
				.chapterID(input.chapterID);

			await deltaBuilder.createVersion(input.title);

			const response: Response = {
				success: true,
				message: 'version successfully created',
				data: {}
			};
			try {
				const result = await deltaBuilder.update();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<DeltaProperties> } };
		}),

	restoreVersion: t.procedure
		.use(logger)
		.use(auth)
		.input(versions)
		.mutation(async ({ input, ctx }) => {
			const deltaBuilder = new DeltaBuilder(input.id)
				.sessionUserID(ctx.session!.user.id)
				.chapterID(input.chapterID);

			await deltaBuilder.restoreVersion(input.versionID!);

			const response: Response = {
				success: true,
				message: 'version successfully restored',
				data: {}
			};
			try {
				const result = await deltaBuilder.update();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<DeltaProperties> } };
		})
});
