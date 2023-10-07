import { faker } from '@faker-js/faker';
import { router } from '$lib/trpc/router';
import {
	cleanUpDatabase,
	connectDevDatabase,
	createDBUser,
	createTestSession,
	createChapter,
	generateTestUser,
	createBook,
	testUserOne,
	getRandomElement
} from '$lib/util/testing/testing';

import type { Session } from '@supabase/supabase-js';

import {
	TEST_DATA_NUM_USERS,
	TEST_DATA_NUM_BOOKS_PER_USER,
	TEST_DATA_CHAPTERS_PER_BOOK
} from '$env/static/private';
import { RATING } from '$lib/properties/review';

const NUM_USERS = parseInt(TEST_DATA_NUM_USERS ?? '50');
const NUM_BOOKS_PER_USER = parseInt(TEST_DATA_NUM_BOOKS_PER_USER ?? '5');
const CHAPTERS_PER_BOOK = parseInt(TEST_DATA_CHAPTERS_PER_BOOK ?? '10');

const TIMEOUT_SECONDS = 60;

beforeAll(async () => {
	console.log('CLEANING UP');

	await connectDevDatabase();
	await cleanUpDatabase();

	console.log('CLEANED');
}, TIMEOUT_SECONDS * 1000);

/**
 * Helper "test" to set up the local db with test data.
 * Sets up test users, books, storyline, chapters, and reviews.
 * If you time out (somehow), increase TIMEOUT_SECONDS.
 * If the setup fails for any other reason, just run it again (happens sometimes 🤷‍♂️).
 */
test(
	'db setup',
	async () => {
		console.log('SETTING UP DB WITH RANDOM TEST DATA');

		const sessions: Session[] = [];
		const caller = router.createCaller({ session: null });

		// push default user
		sessions.push(createTestSession(testUserOne));

		for (let i = 0; i < NUM_USERS; i++) {
			sessions.push(createTestSession(generateTestUser()));
		}

		const reviewCallers = [];

		// Number of reviewers could be an env variable - should be fine for now
		for (let i = 0; i < 3; i++) {
			const reviewer1 = createTestSession(generateTestUser());
			await createDBUser(reviewer1);
			reviewCallers.push(router.createCaller({ session: reviewer1 }));
		}

		for (let i = 0; i < sessions.length; i++) {
			await createDBUser(sessions[i]);
		}

		for (let i = 0; i < sessions.length; i++) {
			for (let j = 0; j < NUM_BOOKS_PER_USER; j++) {
				const newBook = await createBook(sessions[i]);
				const storylines = await caller.storylines.getByBookID({
					bookID: newBook._id
				});

				[...Array(CHAPTERS_PER_BOOK).keys()].map(
					async () =>
						await createChapter(
							sessions[i],
							`${faker.person.firstName()} in ${faker.location.city()}`,
							`${faker.commerce.productDescription()} But a chapter.`,
							storylines[0]
						)
				);

				const num = Math.random();

				// randomly review the storyline
				if (num > 0.3) {
					await reviewCallers[0].reviews.create({
						item: storylines[0]._id,
						reviewOf: 'Storyline',
						rating: getRandomElement(RATING)
					});
					if (num > 0.4) {
						await reviewCallers[1].reviews.create({
							item: storylines[0]._id,
							reviewOf: 'Storyline',
							rating: getRandomElement(RATING)
						});
					}
					if (num > 0.5) {
						await reviewCallers[2].reviews.create({
							item: storylines[0]._id,
							reviewOf: 'Storyline',
							rating: getRandomElement(RATING)
						});
					}
				}
			}
		}

		console.log('DB SETUP COMPLETE');
	},
	TIMEOUT_SECONDS * 1000
);
