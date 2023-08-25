import type { PermissionProperties } from '$lib/shared/permission';
import type { UserProperties } from '$lib/shared/user';
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
import type { HydratedDocument } from 'mongoose';
import { ulid } from 'ulid';

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

		const testUserOneDB = await createDBUser(testUserOneSession);
		const testUserTwoDB = await createDBUser(createTestSession(testUserTwo));

		const createBookResponse = await createBook(testUserOneSession, testBookTitle);
		let permissions = createBookResponse.permissions;

		permissions[testUserTwo.id] = {
			_id: ulid(),
			public: false,
			user: testUserTwoDB._id,
			permission: 'edit'
		} as HydratedDocument<PermissionProperties>;

		// create a new permission
		const caller = router.createCaller({ session: testUserOneSession });
		let updatedBookResponse = await caller.books.update({
			id: createBookResponse._id,
			permissions: permissions
		});

		expect(updatedBookResponse.permissions[testUserTwo.id]?.permission).toEqual('edit');

		permissions = updatedBookResponse.permissions;

		permissions[testUserTwo.id] = {
			_id: ulid(),
			public: false,
			user: testUserTwoDB._id,
			permission: 'view'
		} as HydratedDocument<PermissionProperties>;

		updatedBookResponse = await caller.books.update({
			id: createBookResponse._id,
			permissions: permissions
		});

		expect(updatedBookResponse.permissions[testUserTwo.id]?.permission).toEqual('view');
	});

	test('delete permission', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const createBookResponse = await createBook(testUserOneSession, testBookTitle);

		const caller = router.createCaller({ session: testUserOneSession });
		const getBookResponse = await caller.books.getById({ searchTerm: createBookResponse._id });

		expect(getBookResponse.permissions['public']?.public).toEqual(true);

		// delete permission
		const permissions = getBookResponse.permissions;
		delete permissions[''];

		const updatedBookResponse = await caller.books.update({
			id: getBookResponse._id,
			permissions: permissions
		});

		expect(updatedBookResponse.permissions['']).toEqual(undefined);
	});
});
