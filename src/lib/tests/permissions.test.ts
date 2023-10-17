import type { PermissionProperties } from '$lib/properties/permission';
import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	testUserOne,
	testUserTwo,
	createBook,
	createChapter
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
			user: testUserTwoDB._id,
			permission: 'collaborate'
		} as HydratedDocument<PermissionProperties>;

		// create a new permission
		const caller = router.createCaller({ session: testUserOneSession });
		let updatedBookResponse = await caller.books.update({
			id: createBookResponse._id,
			permissions: permissions
		});

		expect(updatedBookResponse.permissions[testUserTwo.id]?.permission).toEqual('collaborate');

		permissions = updatedBookResponse.permissions;

		permissions[testUserTwo.id] = {
			_id: ulid(),
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
		await createDBUser(createTestSession(testUserTwo));

		const createBookResponse = await createBook(testUserOneSession, testBookTitle);
		let permissions = createBookResponse.permissions;

		permissions[testUserTwo.id] = {
			_id: ulid(),
			user: testUserTwo.id,
			permission: 'collaborate'
		} as HydratedDocument<PermissionProperties>;

		// create a new permission
		const caller = router.createCaller({ session: testUserOneSession });
		let updatedBookResponse = await caller.books.update({
			id: createBookResponse._id,
			permissions: permissions
		});

		expect(updatedBookResponse.permissions[testUserTwo.id]?.permission).toEqual('collaborate');

		// delete permission
		permissions = updatedBookResponse.permissions;
		delete permissions[testUserTwo.id];

		updatedBookResponse = await caller.books.update({
			id: createBookResponse._id,
			permissions: permissions
		});

		expect(updatedBookResponse.permissions[testUserTwo.id]).toEqual(undefined);
	});

	test('test permission', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		await createDBUser(createTestSession(testUserTwo));

		const createBookResponse = await createBook(testUserOneSession, testBookTitle);

		let caller = router.createCaller({ session: testUserOneSession });
		let storylines = await caller.storylines.getAll({
			bookID: createBookResponse._id
		});

		let chapter1Response = await createChapter(
			testUserOneSession,
			'Chapter 1',
			'My chapter 1',
			storylines[0]
		);

		let permissions = chapter1Response.permissions;
		delete permissions['public'];

		// update chapter to be private
		chapter1Response = await caller.chapters.update({
			id: chapter1Response._id,
			permissions: permissions
		});

		expect(chapter1Response.userPermissions?.view).toEqual(true);

		caller = router.createCaller({ session: createTestSession(testUserTwo) });

		storylines = await caller.storylines.getAll({
			bookID: createBookResponse._id
		});

		let storylineChapters = await caller.chapters.getByStoryline({
			storylineID: storylines[0]._id,
			storylineChapterIDs: storylines[0].chapters as string[]
		});

		expect(storylineChapters[0].userPermissions?.view).toEqual(false);

		// update storyline to be private
		permissions = storylines[0].permissions;
		delete permissions['public'];

		caller = router.createCaller({ session: createTestSession(testUserOne) });
		await caller.storylines.update({
			id: storylines[0]._id,
			permissions: permissions
		});

		caller = router.createCaller({ session: createTestSession(testUserTwo) });
		storylineChapters = await caller.chapters.getByStoryline({
			storylineID: storylines[0]._id,
			storylineChapterIDs: storylines[0].chapters as string[]
		});

		expect(storylineChapters.length).toEqual(0);
	});
});
