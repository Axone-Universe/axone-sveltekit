/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';

import { Repository } from '$lib/repositories/repository';
import type { CountReview, ReadReview, ReviewByItem } from '$lib/trpc/schemas/reviews';
import { Review } from '$lib/models/review';
import type { ReviewProperties } from '$lib/properties/review';

export type CountByRating = {
	_id: number;
	count: number;
};

export class ReviewsRepository extends Repository {
	async get(input: ReadReview): Promise<HydratedDocument<ReviewProperties>[]> {
		const pipeline = [];
		const filter: any = {};

		if (input.item) filter.item = input.item;
		if (input.user) filter.user = input.user;
		if (input.rating) filter.rating = input.rating;

		pipeline.push({ $match: filter });

		if (input.cursor) {
			pipeline.push({ $skip: (input.cursor ?? 0) + (input.skip ?? 0) });
		}

		if (input.limit) pipeline.push({ $limit: input.limit });

		const query = Review.aggregate(pipeline);

		return await query;
	}

	async getById(session: Session | null, id?: string): Promise<HydratedDocument<ReviewProperties>> {
		const query = Review.aggregate([{ $match: { _id: id } }])
			.cursor()
			.next();

		return await query;
	}

	async count(countReview: CountReview): Promise<number> {
		const filter: any = {};

		if (countReview.item) filter.item = countReview.item;
		if (countReview.user) filter.user = countReview.user;
		if (countReview.rating) filter.item = countReview.rating;

		return await Review.count(filter);
	}

	async countByRating(reviewByItem: ReviewByItem): Promise<CountByRating[]> {
		return await Review.aggregate([
			{
				$match: {
					item: reviewByItem.item
				}
			},
			{
				$group: {
					_id: '$rating',
					count: { $count: {} }
				}
			}
		]);
	}

	async averageRating(reviewByItem: ReviewByItem): Promise<number> {
		const review = await Review.aggregate([
			{
				$match: {
					item: reviewByItem.item
				}
			},
			{
				$group: {
					_id: null,
					average: { $avg: '$rating' }
				}
			}
		])
			.cursor()
			.next();

		return review.average as number;
	}
}
