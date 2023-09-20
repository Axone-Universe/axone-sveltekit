import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import { count, create, item, read, single, update } from '$lib/trpc/schemas/reviews';
import { ReviewBuilder } from '$lib/documents/review';
import type { Rating } from '$lib/properties/review';
import { ReviewsRepository } from '$lib/repositories/reviewsRepository';
import { StorylinesRepository } from '$lib/repositories/storyLinesRepository';
import type { UserProperties } from '$lib/properties/user';
import { TRPCError } from '@trpc/server';

export const reviews = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input }) => {
			const reviewsRepo = new ReviewsRepository();

			const result = await reviewsRepo.get(input);

			return { result, cursor: result.length > 0 ? result[result.length - 1]._id : undefined };
		}),

	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const reviewsRepo = new ReviewsRepository();
			const result = await reviewsRepo.getById(ctx.session, input.id);

			return result;
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
					throw new TRPCError({ code: 'FORBIDDEN' });
				}
			}

			const reviewBuilder = new ReviewBuilder()
				.sessionUserID(ctx.session!.user.id)
				.item(input.item)
				.reviewOf(input.reviewOf)
				.rating(input.rating as Rating);

			if (input.title) reviewBuilder.title(input.title);
			if (input.text) reviewBuilder.text(input.text);

			const review = await reviewBuilder.build();

			return review;
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

			const review = await reviewBuilder.update();
			return review;
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(single)
		.mutation(async ({ input, ctx }) => {
			const reviewBuilder = new ReviewBuilder(input.id).sessionUserID(ctx.session!.user.id);

			const review = await reviewBuilder.delete();
			return review;
		}),

	count: t.procedure
		.use(logger)
		.input(count)
		.mutation(async ({ input }) => {
			return await new ReviewsRepository().count(input);
		}),

	countByRating: t.procedure
		.use(logger)
		.input(item)
		.mutation(async ({ input }) => {
			return await new ReviewsRepository().countByRating(input);
		}),

	averageRating: t.procedure
		.use(logger)
		.input(item)
		.mutation(async ({ input }) => {
			return await new ReviewsRepository().averageRating(input);
		})
});
