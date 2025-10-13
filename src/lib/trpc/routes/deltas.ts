import { auth } from '$lib/trpc/middleware/auth';
import { DeltasRepository } from '$lib/repositories/deltasRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { update, read, create, versions } from '$lib/trpc/schemas/deltas';
import { DeltaBuilder } from '$lib/documents/digital-assets/delta';
import type { Response } from '$lib/util/types';
import type { DeltaProperties, VersionProperties } from '$lib/properties/delta';
import type { HydratedDocument } from 'mongoose';
import { ChapterProperties } from '$lib/properties/chapter';

export const deltas = t.router({
	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const deltaBuilder = new DeltaBuilder()
				.sessionUser(ctx.user!)
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
				const result = await deltasRepo.getById(ctx, input.id);
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
				.sessionUser(ctx.user!)
				.chapterID(input.chapterID);

			if (input.ops) {
				await deltaBuilder.delta(input.ops);
			}

			const response: Response = {
				success: true,
				message: 'delta successfully updated',
				data: {} as HydratedDocument<ChapterProperties>
			};
			try {
				const result = await deltaBuilder.update();
				response.data = result.chapter as HydratedDocument<ChapterProperties>;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<ChapterProperties> } };
		}),

	createVersion: t.procedure
		.use(logger)
		.use(auth)
		.input(versions)
		.mutation(async ({ input, ctx }) => {
			const deltaBuilder = new DeltaBuilder(input.id)
				.sessionUser(ctx.user!)
				.chapterID(input.chapterID);

			await deltaBuilder.createVersion(input.title);

			const response: Response = {
				success: true,
				message: 'version successfully created',
				data: {}
			};
			try {
				const result = await deltaBuilder.update();
				response.data = result.versions?.at(-2);
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<VersionProperties> } };
		}),

	restoreVersion: t.procedure
		.use(logger)
		.use(auth)
		.input(versions)
		.mutation(async ({ input, ctx }) => {
			const deltaBuilder = new DeltaBuilder(input.id)
				.sessionUser(ctx.user!)
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
