import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	testUserOne,
	testUserTwo,
	createBook
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('books', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('update permission', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		await createDBUser(createTestSession(testUserTwo));

		const createBookResponse = await createBook(testUserOneSession, testBookTitle);

		// create a new permission
		const caller = router.createCaller({ session: testUserOneSession });
		const userPermission = await caller.permissions.create({
			documentID: createBookResponse._id,
			documentType: 'Book',
			permission: 'edit',
			user: testUserTwo.id
		});

		//update permission
		await caller.permissions.update({
			_id: userPermission._id,
			documentID: createBookResponse._id,
			documentType: 'Book',
			permission: 'view'
		});

		const getBookResponse = await caller.books.getById({ searchTerm: createBookResponse._id });
		expect(getBookResponse.permissions![1].permission).toEqual('view');
	});

	test('delete permission', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const createBookResponse = await createBook(testUserOneSession, testBookTitle);

		const caller = router.createCaller({ session: testUserOneSession });
		let getBookResponse = await caller.books.getById({ searchTerm: createBookResponse._id });

		expect(getBookResponse.permissions![0].public).toEqual(true);

		// delete permission
		await caller.permissions.delete({
			_id: getBookResponse.permissions![0]._id,
			documentID: getBookResponse._id,
			documentType: 'Book'
		});

		getBookResponse = await caller.books.getById({ searchTerm: getBookResponse._id });

		expect(getBookResponse.permissions!.length).toEqual(0);
	});
});
