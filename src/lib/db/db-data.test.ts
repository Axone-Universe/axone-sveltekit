import { faker } from '@faker-js/faker';
import { router } from '$lib/trpc/router';
import { GenresBuilder } from '$lib/shared/genre';
import {
	cleanUpDatabase,
	connectDevDatabase,
	createDBUser,
	createTestSession,
	createChapter,
	generateTestUser,
	createBook
} from '$lib/util/testing/testing';

import type { Session } from '@supabase/supabase-js';

import {
	TEST_DATA_NUM_USERS,
	TEST_DATA_NUM_BOOKS_PER_USER,
	TEST_DATA_CHAPTERS_PER_BOOK
} from '$env/static/private';

const NUM_USERS = parseInt(TEST_DATA_NUM_USERS ?? '50');
const NUM_BOOKS_PER_USER = parseInt(TEST_DATA_NUM_BOOKS_PER_USER ?? '5');
const CHAPTERS_PER_BOOK = parseInt(TEST_DATA_CHAPTERS_PER_BOOK ?? '10');

const TIMEOUT_SECONDS = 60;

beforeAll(async () => {
	console.log('CLEANING UP');

	await connectDevDatabase();
	await cleanUpDatabase(true);

	console.log('CLEANED');
}, TIMEOUT_SECONDS * 1000);

/**
 * Helper "test" to set up the local db with test data.
 * Sets up test users, books, storyline, and chapters.
 * If you time out (somehow), increase TIMEOUT_SECONDS.
 * If the setup fails for any other reason, just run it again (happens sometimes 🤷‍♂️).
 */
test(
	'db setup',
	async () => {
		console.log('SETTING UP DB WITH TEST DATA');

		const sessions: Session[] = [];
		const caller = router.createCaller({ session: null });

		for (let i = 0; i < NUM_USERS; i++) {
			sessions.push(createTestSession(generateTestUser()));
		}

		const users = [];

		for (let i = 0; i < sessions.length; i++) {
			users.push(createDBUser(sessions[i]));
		}

		for (let i = 0; i < sessions.length; i++) {
			for (let j = 0; j < NUM_BOOKS_PER_USER; j++) {
				const newBook = await createBook(sessions[i]);
				const storylines = await caller.storylines.getAll({
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
			}
		}

		console.log('DB SETUP COMPLETE');
	},
	TIMEOUT_SECONDS * 1000
);
