import { router } from '$lib/trpc/router';
import type { HydratedDocument } from 'mongoose';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	testUserOne,
	testUserTwo,
	testUserThree,
	createBook
} from '$lib/util/testing/testing';
import type { UserProperties } from '$lib/shared/user';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('books', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create book', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		const userResponse = await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = await caller.storylines.getAll({
			bookID: bookResponse._id
		});

		expect(bookResponse.title).toEqual(testBookTitle);
	});

	test('get all books', async () => {
		await createDBUser(createTestSession(testUserOne));
		await createDBUser(createTestSession(testUserTwo));
		await createDBUser(createTestSession(testUserThree));

		const testBookTitle1 = 'My Book 1';
		const testBookTitle2 = 'My Book 2';
		const testBookTitle3 = 'My Book 3';

		const bookResponse1 = await createBook(createTestSession(testUserOne), testBookTitle1);
		const bookResponse2 = await createBook(createTestSession(testUserTwo), testBookTitle2);
		const bookResponse3 = await createBook(createTestSession(testUserThree), testBookTitle3);

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.getAll();

		expect(bookResponses.map((a) => a._id).sort()).toEqual(
			[bookResponse1._id, bookResponse2._id, bookResponse3._id].sort()
		);
	});

	test('get single book', async () => {
		await createDBUser(createTestSession(testUserOne));
		const testBookTitle1 = 'My Book 1';
		const testBookTitle2 = 'My Book 2';
		const bookResponse = await createBook(createTestSession(testUserOne), testBookTitle1);
		await createBook(createTestSession(testUserOne), testBookTitle2);

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.getByTitle({ searchTerm: testBookTitle1 });

		expect(bookResponses.length).toEqual(1);
		expect(bookResponses.pop()?._id).toEqual(bookResponse._id);
	});
});
