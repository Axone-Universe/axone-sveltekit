/* eslint-disable @typescript-eslint/no-explicit-any */
import { ulid } from 'ulid';
import { startSession, type HydratedDocument, type ClientSession } from 'mongoose';

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
import type { UserProperties } from '$lib/properties/user';

export class ReviewBuilder extends DocumentBuilder<HydratedDocument<ReviewProperties>> {
	private readonly _reviewProperties: ReviewProperties;
	private _sessionUser?: UserProperties;

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

	userID(userID: string): ReviewBuilder {
		this._reviewProperties.user = userID;
		return this;
	}

	sessionUser(sessionUser: UserProperties): ReviewBuilder {
		this._sessionUser = sessionUser;
		return this;
	}

	async build(): Promise<HydratedDocument<ReviewProperties>> {
		if (!this._sessionUser) throw new Error('Must be logged in to give a review.');

		const session = await startSession();
		const review = new Review(this._reviewProperties);

		try {
			await session.withTransaction(async () => {
				review.isNew = true;
				await review.save({ session });

				if (this._reviewProperties.reviewOf === 'Storyline') {
					await this.syncStorylineAndBook(
						session,
						this._sessionUser!,
						this._reviewProperties.item as string,
						1,
						this._reviewProperties.rating
					);
				}
			});
		} finally {
			session.endSession();
		}

		return review as HydratedDocument<ReviewProperties>;
	}

	async update(): Promise<void> {
		if (!this._sessionUser) throw new Error('Must be logged in to update a review.');

		const propsToUpdate: any = {};

		if (this._reviewProperties.rating) propsToUpdate.rating = this._reviewProperties.rating;
		if (this._reviewProperties.text) propsToUpdate.text = this._reviewProperties.text;

		const session = await startSession();

		try {
			await session.withTransaction(async () => {
				const oldReview = await Review.findOneAndUpdate(
					{ _id: this._reviewProperties._id, user: this._reviewProperties.user },
					propsToUpdate,
					{ session, user: this._sessionUser }
				);

				if (oldReview && this._reviewProperties.reviewOf === 'Storyline') {
					await this.syncStorylineAndBook(
						session,
						this._sessionUser!,
						oldReview.item as string,
						0,
						this._reviewProperties.rating - oldReview.rating
					);
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
				const deletedReview = await Review.findOneAndDelete(
					{
						_id: this._reviewProperties._id,
						user: this._reviewProperties.user
					},
					{ session }
				);

				if (deletedReview && this._reviewProperties.reviewOf === 'Storyline') {
					await this.syncStorylineAndBook(
						session,
						this._sessionUser!,
						deletedReview.item as string,
						-1,
						deletedReview.rating * -1
					);
				}
			});
		} finally {
			session.endSession();
		}
	}

	async syncStorylineAndBook(
		session: ClientSession,
		user: UserProperties,
		storylineID: string,
		numRatings: number,
		cumulativeRating: number
	) {
		const storyline = await Storyline.aggregate([{ $match: { _id: storylineID } }], {
			session,
			user
		})
			.cursor()
			.next();

		if (storyline) {
			await Storyline.updateOne(
				{ _id: storyline._id },
				{
					$inc: {
						numRatings,
						cumulativeRating
					}
				},
				{ session, user: storyline.user }
			);

			await Storyline.aggregate([
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

			// NOTE: removed the book update because we are going to do away with books
		} else {
			return new Error('Storyline does not exist!');
		}
	}
}
