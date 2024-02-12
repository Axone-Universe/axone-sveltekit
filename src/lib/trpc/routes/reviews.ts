import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { count, create, item, read, single, update } from '$lib/trpc/schemas/reviews';
import { ReviewBuilder } from '$lib/documents/review';
import type { Rating, ReviewProperties } from '$lib/properties/review';
import { ReviewsRepository, type CountByRating } from '$lib/repositories/reviewsRepository';
import { StorylinesRepository } from '$lib/repositories/storyLinesRepository';
import type { UserProperties } from '$lib/properties/user';
import { TRPCError } from '@trpc/server';
import type { Response } from '$lib/util/types';
import type { HydratedDocument } from 'mongoose';

export const reviews = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input }) => {
			const reviewsRepo = new ReviewsRepository();

			const response: Response = {
				success: true,
				message: 'reviews successfully retrieved',
				data: {}
			};
			try {
				const result = await reviewsRepo.get(input);
				response.data = result;
				response.cursor = result.length > 0 ? result[result.length - 1]._id : undefined;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<ReviewProperties>[] } };
		}),

	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const reviewsRepo = new ReviewsRepository();

			const response: Response = {
				success: true,
				message: 'reviews successfully retrieved',
				data: {}
			};
			try {
				const result = await reviewsRepo.getById(ctx.session, input.id);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<ReviewProperties> } };
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			// Ensure that user sending review is not the creator of the reviewed item itself
			if (input.reviewOf === 'Storyline') {
				const storylinesRepo = new StorylinesRepository();
				const storyline = await storylinesRepo.getById(ctx.session, input.item);
				if (storyline && (storyline.user as UserProperties)._id === ctx.session?.user.id) {
					throw new TRPCError({ code: 'FORBIDDEN', message: 'Self reviews are not allowed' });
				}
			}

			const reviewBuilder = new ReviewBuilder()
				.sessionUserID(ctx.session!.user.id)
				.item(input.item)
				.reviewOf(input.reviewOf)
				.rating(input.rating as Rating);

			if (input.title) reviewBuilder.title(input.title);
			if (input.text) reviewBuilder.text(input.text);

			const response: Response = {
				success: true,
				message: 'review successfully created',
				data: {}
			};
			try {
				const result = await reviewBuilder.build();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<ReviewProperties> } };
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const reviewBuilder = new ReviewBuilder(input.id).sessionUserID(ctx.session!.user.id);

			if (input.title) reviewBuilder.title(input.title);
			if (input.text) reviewBuilder.text(input.text);
			if (input.rating) reviewBuilder.rating(input.rating as Rating);

			const response: Response = {
				success: true,
				message: 'review successfully updated',
				data: {}
			};
			try {
				const result = await reviewBuilder.update();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return response;
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(single)
		.mutation(async ({ input, ctx }) => {
			const reviewBuilder = new ReviewBuilder(input.id).sessionUserID(ctx.session!.user.id);

			const response: Response = {
				success: true,
				message: 'review successfully deleted',
				data: {}
			};
			try {
				const result = await reviewBuilder.delete();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return response;
		}),

	count: t.procedure
		.use(logger)
		.input(count)
		.mutation(async ({ input }) => {
			const response: Response = {
				success: true,
				message: 'reviews successfully obtained',
				data: {}
			};
			try {
				const result = await new ReviewsRepository().count(input);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as number } };
		}),

	countByRating: t.procedure
		.use(logger)
		.input(item)
		.mutation(async ({ input }) => {
			const response: Response = {
				success: true,
				message: 'reviews successfully obtained',
				data: {}
			};
			try {
				const result = await new ReviewsRepository().countByRating(input);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as CountByRating[] } };
		}),

	averageRating: t.procedure
		.use(logger)
		.input(item)
		.mutation(async ({ input }) => {
			const response: Response = {
				success: true,
				message: 'reviews average obtained',
				data: {}
			};
			try {
				const result = await new ReviewsRepository().averageRating(input);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as number } };
		})
});
