import type { PermissionProperties } from '$lib/shared/permission';
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

		await createDBUser(testUserOneSession);
		await createDBUser(createTestSession(testUserTwo));

		const createBookResponse = await createBook(testUserOneSession, testBookTitle);
		let permissions = createBookResponse.permissions;

		permissions.set(testUserTwo.id, {
			_id: ulid(),
			public: false,
			user: testUserTwo.id,
			permission: 'edit'
		} as HydratedDocument<PermissionProperties>);

		// create a new permission
		const caller = router.createCaller({ session: testUserOneSession });
		let updatedBookResponse = await caller.books.update({
			id: createBookResponse._id,
			permissions: permissions as any
		});

		expect(updatedBookResponse.permissions.get(testUserTwo.id)?.permission).toEqual('edit');

		permissions = updatedBookResponse.permissions;

		permissions.set(testUserTwo.id, {
			_id: ulid(),
			public: false,
			user: testUserTwo.id,
			permission: 'view'
		} as HydratedDocument<PermissionProperties>);

		updatedBookResponse = await caller.books.update({
			id: createBookResponse._id,
			permissions: permissions as any
		});

		expect(updatedBookResponse.permissions.get(testUserTwo.id)?.permission).toEqual('view');
	});

	test('delete permission', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const createBookResponse = await createBook(testUserOneSession, testBookTitle);

		const caller = router.createCaller({ session: testUserOneSession });
		const getBookResponse = await caller.books.getById({ searchTerm: createBookResponse._id });

		expect(getBookResponse.permissions.get('public')?.public).toEqual(true);

		// delete permission
		const permissions = getBookResponse.permissions as any;
		permissions.delete('');

		const updatedBookResponse = await caller.books.update({
			id: getBookResponse._id,
			permissions: permissions
		});

		expect(updatedBookResponse.permissions.get('')).toEqual(undefined);
	});
});
