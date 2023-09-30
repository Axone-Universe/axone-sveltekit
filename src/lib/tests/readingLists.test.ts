import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	testUserOne,
	createBook
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('reading lists', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('update lists', async () => {
		const testUserOneSession = createTestSession(testUserOne);
		const userResponse = await createDBUser(testUserOneSession);

		expect(userResponse.readingLists?.length).toEqual(3);
		expect(userResponse.readingLists[0].title).toEqual('Finished Reading');

		const testBookTitle = 'My Book';
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		userResponse.readingLists[0].books[bookResponse._id] = bookResponse._id;

		const caller = router.createCaller({ session: testUserOneSession });
		const updateUserResponse = await caller.users.update({
			_id: userResponse._id,
			readingLists: userResponse.readingLists
		});

		expect(updateUserResponse.readingLists[0].title).toEqual('Finished Reading');
		expect(updateUserResponse.readingLists[0].books[bookResponse._id]).toEqual(bookResponse._id);
	});
});
