/* eslint-disable @typescript-eslint/no-explicit-any */
import { ulid } from 'ulid';
import { startSession, type HydratedDocument } from 'mongoose';

import { DocumentBuilder } from '$lib/documents/documentBuilder';
import { Review } from '$lib/models/review';
import {
	ReviewPropertyBuilder,
	type ReviewProperties,
	type ReviewOf,
	type Rating
} from '$lib/properties/review';
import { Storyline } from '$lib/models/storyline';
import { Book } from '$lib/models/book';

export class ReviewBuilder extends DocumentBuilder<HydratedDocument<ReviewProperties>> {
	private readonly _reviewProperties: ReviewProperties;

	constructor(id?: string) {
		super();

		this._reviewProperties = new ReviewPropertyBuilder().getProperties();
		this._reviewProperties._id = id ? id : ulid();
		this._reviewProperties.createDate = new Date();
	}

	item(itemID: string): ReviewBuilder {
		this._reviewProperties.item = itemID;
		return this;
	}

	reviewOf(reviewOf: ReviewOf): ReviewBuilder {
		this._reviewProperties.reviewOf = reviewOf;
		return this;
	}

	rating(rating: Rating): ReviewBuilder {
		this._reviewProperties.rating = rating;
		return this;
	}

	title(title: string): ReviewBuilder {
		this._reviewProperties.title = title;
		return this;
	}

	text(text: string): ReviewBuilder {
		this._reviewProperties.text = text;
		return this;
	}

	sessionUserID(sessionUserID: string): ReviewBuilder {
		this._reviewProperties.user = sessionUserID;
		return this;
	}

	async build(): Promise<HydratedDocument<ReviewProperties>> {
		if (!this._reviewProperties.user) throw new Error('Must be logged in to give a review.');

		const session = await startSession();

		const review = new Review(this._reviewProperties);

		try {
			await session.withTransaction(async () => {
				await review.save({ session });

				if (this._reviewProperties.reviewOf === 'Storyline') {
					const storyline = await Storyline.aggregate([
						{ $match: { _id: this._reviewProperties.item } }
					])
						.session(session)
						.cursor()
						.next();

					if (storyline) {
						await Storyline.updateOne(
							{ _id: storyline._id },
							{
								$inc: {
									numRatings: 1,
									cumulativeRating: this._reviewProperties.rating
								}
							},
							{ session, userID: storyline.user._id }
						);

						const maxStoryline = await Storyline.aggregate([
							{
								$match: {
									book: storyline.book._id
								}
							},
							{
								$group: {
									_id: null,
									maxAvg: {
										$max: {
											$cond: [
												{ $eq: ['$numRatings', 0] },
												0,
												{ $divide: ['$cumulativeRating', '$numRatings'] }
											]
										}
									}
								}
							}
						])
							.session(session)
							.cursor()
							.next();

						await Book.updateOne(
							{ _id: storyline.book._id },
							{
								$set: {
									rating: maxStoryline.maxAvg
								}
							},
							{ session, userID: storyline.book.user }
						);
					} else {
						return new Error();
					}
				}
			});
		} finally {
			session.endSession();
		}

		return review as HydratedDocument<ReviewProperties>;
	}

	async update(): Promise<void> {
		if (!this._reviewProperties.user) throw new Error('Must be logged in to update a review.');

		const propsToUpdate: any = {};

		if (this._reviewProperties.rating) propsToUpdate.rating = this._reviewProperties.rating;
		if (this._reviewProperties.text) propsToUpdate.text = this._reviewProperties.text;

		const session = await startSession();

		try {
			await session.withTransaction(async () => {
				const oldReview = await Review.findOneAndUpdate(
					{ _id: this._reviewProperties._id, user: this._reviewProperties.user },
					propsToUpdate,
					{ session }
				);

				if (oldReview && this._reviewProperties.reviewOf === 'Storyline') {
					const storyline = await Storyline.aggregate([
						{ $match: { _id: this._reviewProperties.item } }
					])
						.session(session)
						.cursor()
						.next();

					if (storyline) {
						await Storyline.updateOne(
							{ _id: storyline._id },
							{
								$inc: {
									cumulativeRating: this._reviewProperties.rating - oldReview.rating
								}
							},
							{ session, userID: storyline.user._id }
						);

						const maxStoryline = await Storyline.aggregate([
							{
								$match: {
									book: storyline.book._id
								}
							},
							{
								$group: {
									_id: '$_id',
									maxAvg: {
										$max: {
											$cond: [
												{ $eq: ['$numRatings', 0] },
												0,
												{ $divide: ['$cumulativeRating', '$numRatings'] }
											]
										}
									}
								}
							}
						])
							.session(session)
							.cursor()
							.next();

						await Book.updateOne(
							{ _id: storyline.book._id },
							{
								$set: {
									rating: maxStoryline.maxAvg
								}
							},
							{ session }
						);
					} else {
						return new Error();
					}
				}
			});
		} finally {
			session.endSession();
		}
	}

	async delete(): Promise<void> {
		if (!this._reviewProperties.user) throw new Error('Must be logged in to delete a review.');

		const session = await startSession();

		try {
			await session.withTransaction(async () => {
				const deletedReview = await Review.findOneAndDelete({
					_id: this._reviewProperties._id,
					user: this._reviewProperties.user
				});

				if (deletedReview && this._reviewProperties.reviewOf === 'Storyline') {
					const storyline = await Storyline.aggregate([
						{ $match: { _id: this._reviewProperties.item } }
					])
						.session(session)
						.cursor()
						.next();

					if (storyline) {
						await Storyline.updateOne(
							{ _id: storyline._id },
							{
								$inc: {
									numRatings: -1,
									cumulativeRating: deletedReview.rating
								}
							},
							{ session, userID: storyline.user._id }
						);

						const maxStoryline = await Storyline.aggregate([
							{
								$match: {
									book: storyline.book._id
								}
							},
							{
								$group: {
									_id: '$_id',
									maxAvg: {
										$max: {
											$cond: [
												{ $eq: ['$numRatings', 0] },
												0,
												{ $divide: ['$cumulativeRating', '$numRatings'] }
											]
										}
									}
								}
							}
						])
							.session(session)
							.cursor()
							.next();

						await Book.updateOne(
							{ _id: storyline.book._id },
							{
								$set: {
									rating: maxStoryline.maxAvg
								}
							},
							{ session }
						);
					} else {
						return new Error();
					}
				}
			});
		} finally {
			session.endSession();
		}
	}
}
