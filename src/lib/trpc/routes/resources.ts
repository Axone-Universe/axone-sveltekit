import { auth } from '$lib/trpc/middleware/auth';
import { ResourcesRepository } from '$lib/repositories/resourcesRepository';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { update, read, create } from '$lib/trpc/schemas/resources';
import { ResourceBuilder } from '$lib/documents/digital-assets/resource';
import type { Response } from '$lib/util/types';
import type { HydratedDocument } from 'mongoose';
import type { ResourceProperties } from '$lib/properties/resource';
import type mongoose from 'mongoose';

export const resources = t.router({
	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const resourceBuilder = new ResourceBuilder()
				.sessionUserID(ctx.session!.user.id)
				.userID(ctx.session!.user.id)
				.type(input.type);

			if (input.chapterID) resourceBuilder.chapterID(input.chapterID);

			const response: Response = {
				success: true,
				message: 'resource successfully created',
				data: {}
			};

			try {
				const result = await resourceBuilder.build();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<ResourceProperties> } };
		}),
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const resourcesRepo = new ResourcesRepository();

			const response: Response = {
				success: true,
				message: 'resources successfully obtained',
				data: {}
			};
			try {
				const result = await resourcesRepo.get(ctx.session, input);

				response.data = result;
				response.cursor = result.length > 0 ? (input.cursor ?? 0) + result.length : undefined;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<ResourceProperties>[] } };
		}),

	getByIds: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const resourcesRepo = new ResourcesRepository();

			const response: Response = {
				success: true,
				message: 'resources successfully retrieved',
				data: {}
			};
			try {
				const result = await resourcesRepo.getByIds(ctx.session, input.ids!);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<ResourceProperties>[] } };
		}),
	getByChapterID: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const resourcesRepo = new ResourcesRepository();

			const response: Response = {
				success: true,
				message: 'resources successfully retrieved',
				data: {}
			};
			try {
				const result = await resourcesRepo.getByChapterID(ctx.session, input.chapterID);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<ResourceProperties>[] } };
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const resourceBuilder = new ResourceBuilder(input.id).sessionUserID(ctx.session!.user.id);

			console.log('>> updating resource');
			console.log(input);

			if (input.title) resourceBuilder.title(input.title);
			if (input.description) resourceBuilder.description(input.description);
			if (input.type) resourceBuilder.type(input.type);
			if (input.userID) resourceBuilder.userID(input.userID);
			if (input.chapterID) resourceBuilder.chapterID(input.chapterID);
			if (input.src) resourceBuilder.src(input.src);
			if (input.alt) resourceBuilder.alt(input.alt);
			if (input.properties) resourceBuilder.properties(input.properties);

			if (input.price) resourceBuilder.price(input.price);
			if (input.collection) resourceBuilder.collection(input.collection);
			if (input.royalties) resourceBuilder.royalties(input.royalties);

			const response: Response = {
				success: true,
				message: 'resource successfully updated',
				data: {}
			};
			try {
				const result = await resourceBuilder.update();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<ResourceProperties> } };
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const resourceBuilder = new ResourceBuilder(input.id).sessionUserID(ctx.session!.user.id);

			const response: Response = {
				success: true,
				message: 'resource successfully deleted',
				data: {}
			};
			try {
				const result = await resourceBuilder.delete();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as mongoose.mongo.DeleteResult } };
		})
});
