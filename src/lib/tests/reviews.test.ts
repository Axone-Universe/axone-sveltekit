import { RATING } from '$lib/properties/review';
import type { StorylineProperties } from '$lib/properties/storyline';
import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	createBook,
	generateTestUser,
	createReview,
	getRandomElement,
	getRandomKey
} from '$lib/util/testing/testing';
import type { Session } from '@supabase/supabase-js';
import { format } from 'date-fns';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('reviews', async () => {
	const testUserOneSession = createTestSession(generateTestUser());
	const testUserTwoSession = createTestSession(generateTestUser());
	const testUserThreeSession = createTestSession(generateTestUser());
	const caller1 = router.createCaller({ session: testUserOneSession });
	const caller2 = router.createCaller({ session: testUserTwoSession });
	const caller3 = router.createCaller({ session: testUserThreeSession });

	beforeEach(async () => {
		await cleanUpDatabase();
		await createDBUser(testUserOneSession);
		await createDBUser(testUserTwoSession);
		await createDBUser(testUserThreeSession);
	});

	test('create a storyline review as not the storyline creator', async () => {
		const rating = 3;
		const reviewOf = 'Storyline';

		const bookResponse = await createBook(testUserOneSession);

		const storylines = await caller1.storylines.getAll({
			bookID: bookResponse._id
		});

		const reviewResponse = await createReview(
			testUserTwoSession,
			storylines[0]._id,
			reviewOf,
			rating
		);

		expect(reviewResponse.user).toEqual(testUserTwoSession.user.id);
		expect(reviewResponse.item).toEqual(storylines[0]._id);
		expect(reviewResponse.reviewOf).toEqual(reviewOf);
		expect(reviewResponse.rating).toEqual(rating);
		expect(reviewResponse.text).toEqual(undefined);
		expect(reviewResponse.title).toEqual(undefined);
		expect(format(reviewResponse.createDate, 'MM/dd/yyyy')).toEqual(
			format(new Date(), 'MM/dd/yyyy')
		);
	});

	test('throws on creating a storyline review as the storyline creator', async () => {
		const rating = 3;
		const reviewOf = 'Storyline';

		const bookResponse = await createBook(testUserOneSession);

		const storylines = await caller1.storylines.getAll({
			bookID: bookResponse._id
		});

		expect(
			async () => await createReview(testUserOneSession, storylines[0]._id, reviewOf, rating)
		).rejects.toThrowError('FORBIDDEN');
	});

	test('throws on creating more than one review for the same storyline', async () => {
		const rating = 3;
		const reviewOf = 'Storyline';

		const bookResponse = await createBook(testUserOneSession);

		const storylines = await caller1.storylines.getAll({
			bookID: bookResponse._id
		});

		await createReview(testUserTwoSession, storylines[0]._id, reviewOf, rating);

		expect(
			async () => await createReview(testUserTwoSession, storylines[0]._id, reviewOf, rating)
		).rejects.toThrowError('duplicate key error');
	});

	test('get a review by ID', async () => {
		const rating = 3;
		const reviewOf = 'Storyline';

		const bookResponse = await createBook(testUserOneSession);

		const storylines = await caller1.storylines.getAll({
			bookID: bookResponse._id
		});

		const reviewResponse = await createReview(
			testUserTwoSession,
			storylines[0]._id,
			reviewOf,
			rating
		);

		const review = await caller2.reviews.getById({ id: reviewResponse._id });

		expect(review._id).toEqual(reviewResponse._id);
	});

	test('get reviews for a storyline with limit and cursor', async () => {
		const bookResponse = await createBook(testUserOneSession);

		// add main storyline
		const storylines = [
			(
				await caller1.storylines.getAll({
					bookID: bookResponse._id
				})
			)[0]
		];

		const chapter1Response = await caller1.chapters.create({
			title: 'Chapter Title',
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id
		});

		// add new storyline
		storylines.push(
			await caller1.storylines.create({
				title: 'Storyline 2',
				description: 'Storyline 2',
				book: bookResponse._id,
				parent: storylines[0]._id,
				parentChapter: chapter1Response._id
			})
		);

		const reviewOf = 'Storyline';
		const numReviewers = 10;
		// store IDs of reviews for main storyline
		const reviewIDs: string[] = [];

		// create new users and have each randomly review main or new storyline
		for (let i = 0; i < numReviewers; i++) {
			const session = createTestSession(generateTestUser());
			await createDBUser(session);

			const rating = getRandomElement(RATING);
			const storyline = getRandomElement(storylines) as StorylineProperties;
			const review = await createReview(session, storyline._id, reviewOf, rating);
			if (storyline._id === storylines[0]._id) {
				reviewIDs.push(review._id);
			}
		}

		// get reviews for main storyline
		const reviews1 = await caller1.reviews.get({
			item: storylines[0]._id,
			limit: numReviewers / 2
		});
		const reviews2 = await caller1.reviews.get({
			item: storylines[0]._id,
			limit: numReviewers / 2,
			cursor: reviews1.cursor
		});

		// make sure that reviews for main storyline are expected
		expect([...reviews1.result, ...reviews2.result].map((a) => a._id).sort()).toEqual(
			reviewIDs.sort()
		);
	});

	test('get reviews for a user', async () => {
		const bookResponse = await createBook(testUserOneSession);

		const storylines = await caller1.storylines.getAll({
			bookID: bookResponse._id
		});

		const chapter1Response = await caller1.chapters.create({
			title: 'Chapter Title',
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id
		});

		const storyline2 = await caller1.storylines.create({
			title: 'Storyline 2',
			description: 'Storyline 2',
			book: bookResponse._id,
			parent: storylines[0]._id,
			parentChapter: chapter1Response._id
		});

		const rating = 3;
		const reviewOf = 'Storyline';

		const reviewResponse1 = await createReview(
			testUserTwoSession,
			storylines[0]._id,
			reviewOf,
			rating
		);

		const reviewResponse2 = await createReview(
			testUserTwoSession,
			storyline2._id,
			reviewOf,
			rating
		);

		await createReview(testUserThreeSession, storyline2._id, reviewOf, rating);

		const reviews = await caller1.reviews.get({ user: testUserTwoSession.user.id });

		expect(reviews.result.map((a) => a._id).sort()).toEqual(
			[reviewResponse1._id, reviewResponse2._id].sort()
		);
	});

	test('update a review', async () => {
		const rating = 3;
		const newRating = 4;
		const reviewOf = 'Storyline';

		const bookResponse = await createBook(testUserOneSession);
		const storylines = await caller1.storylines.getAll({
			bookID: bookResponse._id
		});

		const reviewResponse = await createReview(
			testUserTwoSession,
			storylines[0]._id,
			reviewOf,
			rating
		);

		await caller2.reviews.update({
			id: reviewResponse._id,
			rating: newRating
		});

		const review = await caller2.reviews.getById({ id: reviewResponse._id });

		expect(review.rating).toEqual(newRating);
	});

	test('update a review as not the reviewer does nothing', async () => {
		const rating = 3;
		const newRating = 4;
		const reviewOf = 'Storyline';

		const bookResponse = await createBook(testUserOneSession);
		const storylines = await caller1.storylines.getAll({
			bookID: bookResponse._id
		});

		const reviewResponse = await createReview(
			testUserTwoSession,
			storylines[0]._id,
			reviewOf,
			rating
		);

		// should do nothing as the id of caller3 does not match the reviewer (user2)
		await caller3.reviews.update({
			id: reviewResponse._id,
			rating: newRating
		});

		const review = await caller2.reviews.getById({ id: reviewResponse._id });

		expect(review.rating).toEqual(rating);
	});

	test('delete a review as reviewer', async () => {
		const rating = 3;
		const reviewOf = 'Storyline';

		const bookResponse = await createBook(testUserOneSession);
		const storylines = await caller1.storylines.getAll({
			bookID: bookResponse._id
		});

		const reviewResponse = await createReview(
			testUserTwoSession,
			storylines[0]._id,
			reviewOf,
			rating
		);

		await caller2.reviews.delete({
			id: reviewResponse._id
		});

		const review = await caller2.reviews.getById({ id: reviewResponse._id });

		expect(review).toBeNull();
	});

	test('delete a review as not the reviewer does nothing', async () => {
		const rating = 3;
		const reviewOf = 'Storyline';

		const bookResponse = await createBook(testUserOneSession);
		const storylines = await caller1.storylines.getAll({
			bookID: bookResponse._id
		});

		const reviewResponse = await createReview(
			testUserTwoSession,
			storylines[0]._id,
			reviewOf,
			rating
		);

		// should do nothing as the id of caller3 does not match the reviewer (user2)
		await caller3.reviews.delete({
			id: reviewResponse._id
		});

		const review = await caller2.reviews.getById({ id: reviewResponse._id });

		expect(review._id).toEqual(reviewResponse._id);
	});

	test('get number of reviews for a storyline', async () => {
		const reviewOf = 'Storyline';

		const numStorylines = 3;
		const numReviews = 10;
		const storylineReviews: Record<string, number> = {};

		// create and record each storyline
		for (let i = 0; i < numStorylines; i++) {
			const bookResponse = await createBook(testUserOneSession);
			const storylines = await caller1.storylines.getByBookID({
				bookID: bookResponse._id
			});

			storylineReviews[storylines[0]._id] = 0;
		}

		// create users and randomly review a storyline
		for (let i = 0; i < numReviews; i++) {
			const session = createTestSession(generateTestUser());
			await createDBUser(session);

			const rating = getRandomElement(RATING);
			const storylineID = getRandomKey(storylineReviews) as string;
			await createReview(session, storylineID, reviewOf, rating);
			// record new review
			storylineReviews[storylineID] += 1;
		}

		// check that number of reviews for each storyline match
		for (const [key, value] of Object.entries(storylineReviews)) {
			const count = await caller2.reviews.count({ item: key });
			expect(count).toEqual(value);
		}
	});

	test('get number of reviews from a user', async () => {
		const numReviewers = 3;
		const numStorylines = 10;
		const reviewOf = 'Storyline';

		const reviewers = [];
		const reviews: Record<string, number> = {};

		// create users and record them
		for (let i = 0; i < numReviewers; i++) {
			const session = createTestSession(generateTestUser());
			await createDBUser(session);
			reviewers.push(session);
			reviews[session.user.id] = 0;
		}

		//	create storylines and randomly pick a user to review
		for (let i = 0; i < numStorylines; i++) {
			const bookResponse = await createBook(testUserOneSession);
			const storylines = await caller1.storylines.getByBookID({
				bookID: bookResponse._id
			});

			const rating = getRandomElement(RATING);
			const reviewer = getRandomElement(reviewers) as Session;
			reviews[reviewer.user.id] += 1;
			await createReview(reviewer, storylines[0]._id, reviewOf, rating);
		}

		// check that number of reviews for each user is expected
		for (const r of reviewers) {
			const count = await caller2.reviews.count({ user: r.user.id });
			expect(count).toEqual(reviews[r.user.id]);
		}
	});

	test('get number of reviews for each rating of a storyline', async () => {
		const bookResponse = await createBook(testUserOneSession);
		const storylines = await caller1.storylines.getByBookID({
			bookID: bookResponse._id
		});

		const reviewOf = 'Storyline';
		const expectedCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

		// create new users and review the storyline with a random rating
		for (let i = 0; i < 10; i++) {
			const session = createTestSession(generateTestUser());
			await createDBUser(session);

			const rating = getRandomElement(RATING);
			await createReview(session, storylines[0]._id, reviewOf, rating);
			expectedCounts[rating] += 1;
		}

		const expectedResponse = [];

		// construct the expected response
		for (const [key, value] of Object.entries(expectedCounts)) {
			if (value > 0) {
				expectedResponse.push({ _id: parseInt(key), count: value });
			}
		}

		const count = await caller2.reviews.countByRating({ item: storylines[0]._id });

		// check that the ratings returned are correct
		expect(count).toEqual(expect.arrayContaining(expectedResponse));
		expect(count.length).toEqual(expectedResponse.length);
	});

	test('get average rating for a storyline', async () => {
		const bookResponse = await createBook(testUserOneSession);
		const storylines = await caller1.storylines.getByBookID({
			bookID: bookResponse._id
		});

		const reviewOf = 'Storyline';
		const ratings = [];
		const numReviews = 10;

		// create users and give random rating to storyline
		for (let i = 0; i < numReviews; i++) {
			const session = createTestSession(generateTestUser());
			await createDBUser(session);

			const rating = getRandomElement(RATING);
			await createReview(session, storylines[0]._id, reviewOf, rating);

			ratings.push(rating);
		}

		const average = await caller2.reviews.averageRating({ item: storylines[0]._id });

		// check that average returned matches
		expect(average).toEqual(
			ratings.reduce((previous: number, current: number) => previous + current) / ratings.length
		);
	});

	test('new review of a storyline updates the storyline and corresponding book', async () => {
		const reviewOf = 'Storyline';

		const numStorylines = 3;
		const storylineReviews: string[] = [];

		const bookResponse = await createBook(testUserOneSession);
		const storylines = await caller1.storylines.getByBookID({
			bookID: bookResponse._id
		});
		storylineReviews.push(storylines[0]._id);
		const chapter1Response = await caller1.chapters.create({
			title: 'Chapter Title',
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id
		});

		for (let i = 0; i < numStorylines - 1; i++) {
			storylineReviews.push(
				(
					await caller1.storylines.create({
						title: `Storyline ${i}`,
						description: `Storyline ${i}`,
						book: bookResponse._id,
						parent: storylines[0]._id,
						parentChapter: chapter1Response._id
					})
				)._id
			);
		}

		let book = await caller2.books.getById({ id: bookResponse._id });
		let storyline = await caller2.storylines.getById({ storylineID: storylineReviews[0] });
		expect(book.rating).toEqual(0);
		expect(storyline.numRatings).toEqual(0);
		expect(storyline.cumulativeRating).toEqual(0);

		await createReview(testUserTwoSession, storylineReviews[0], reviewOf, 3);

		book = await caller2.books.getById({ id: bookResponse._id });
		storyline = await caller2.storylines.getById({ storylineID: storylineReviews[0] });
		expect(book.rating).toEqual(3);
		expect(storyline.numRatings).toEqual(1);
		expect(storyline.cumulativeRating).toEqual(3);

		await createReview(testUserTwoSession, storylineReviews[1], reviewOf, 4);

		book = await caller2.books.getById({ id: bookResponse._id });
		storyline = await caller2.storylines.getById({ storylineID: storylineReviews[1] });
		expect(book.rating).toEqual(4);
		expect(storyline.numRatings).toEqual(1);
		expect(storyline.cumulativeRating).toEqual(4);

		await createReview(testUserThreeSession, storylineReviews[0], reviewOf, 4);

		book = await caller2.books.getById({ id: bookResponse._id });
		storyline = await caller2.storylines.getById({ storylineID: storylineReviews[0] });
		expect(book.rating).toEqual(4);
		expect(storyline.numRatings).toEqual(2);
		expect(storyline.cumulativeRating).toEqual(7);

		await createReview(testUserThreeSession, storylineReviews[2], reviewOf, 5);

		book = await caller2.books.getById({ id: bookResponse._id });
		storyline = await caller2.storylines.getById({ storylineID: storylineReviews[2] });
		expect(book.rating).toEqual(5);
		expect(storyline.numRatings).toEqual(1);
		expect(storyline.cumulativeRating).toEqual(5);
	});

	test('update of a review of a storyline updates the storyline and corresponding book', async () => {
		const reviewOf = 'Storyline';

		const numStorylines = 3;
		const storylineReviews: string[] = [];

		const bookResponse = await createBook(testUserOneSession);
		const storylines = await caller1.storylines.getByBookID({
			bookID: bookResponse._id
		});
		storylineReviews.push(storylines[0]._id);
		const chapter1Response = await caller1.chapters.create({
			title: 'Chapter Title',
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id
		});

		for (let i = 0; i < numStorylines - 1; i++) {
			storylineReviews.push(
				(
					await caller1.storylines.create({
						title: `Storyline ${i}`,
						description: `Storyline ${i}`,
						book: bookResponse._id,
						parent: storylines[0]._id,
						parentChapter: chapter1Response._id
					})
				)._id
			);
		}

		const review1 = await createReview(testUserTwoSession, storylineReviews[0], reviewOf, 3);
		const review2 = await createReview(testUserThreeSession, storylineReviews[1], reviewOf, 4);

		await caller2.reviews.update({ id: review1._id, rating: 2 });

		let book = await caller2.books.getById({ id: bookResponse._id });
		let storyline = await caller2.storylines.getById({ storylineID: storylineReviews[0] });
		expect(book.rating).toEqual(4);
		expect(storyline.numRatings).toEqual(1);
		expect(storyline.cumulativeRating).toEqual(2);

		await caller3.reviews.update({ id: review2._id, rating: 5 });

		book = await caller2.books.getById({ id: bookResponse._id });
		storyline = await caller2.storylines.getById({ storylineID: storylineReviews[1] });
		expect(book.rating).toEqual(5);
		expect(storyline.numRatings).toEqual(1);
		expect(storyline.cumulativeRating).toEqual(5);
	});

	test('deletion of a review of a storyline updates the storyline and corresponding book', async () => {
		const reviewOf = 'Storyline';

		const numStorylines = 3;
		const storylineReviews: string[] = [];

		const bookResponse = await createBook(testUserOneSession);
		const storylines = await caller1.storylines.getByBookID({
			bookID: bookResponse._id
		});
		storylineReviews.push(storylines[0]._id);
		const chapter1Response = await caller1.chapters.create({
			title: 'Chapter Title',
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id
		});

		for (let i = 0; i < numStorylines - 1; i++) {
			storylineReviews.push(
				(
					await caller1.storylines.create({
						title: `Storyline ${i}`,
						description: `Storyline ${i}`,
						book: bookResponse._id,
						parent: storylines[0]._id,
						parentChapter: chapter1Response._id
					})
				)._id
			);
		}

		await createReview(testUserTwoSession, storylineReviews[0], reviewOf, 3);
		await createReview(testUserThreeSession, storylineReviews[0], reviewOf, 4);
		const review3 = await createReview(testUserThreeSession, storylineReviews[1], reviewOf, 4);

		await caller3.reviews.delete({ id: review3._id });

		const book = await caller2.books.getById({ id: bookResponse._id });
		const storyline = await caller2.storylines.getById({ storylineID: storylineReviews[0] });
		expect(book.rating).toEqual(3.5);
		expect(storyline.numRatings).toEqual(2);
		expect(storyline.cumulativeRating).toEqual(7);
	});

	// TODO: test cascading deletes of storylines
});
