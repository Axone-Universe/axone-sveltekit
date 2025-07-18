import type { PermissionProperties } from '$lib/properties/permission';
import { router } from '$lib/trpc/router';
import {
	connectDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	createBook,
	createChapter,
	generateUserSessionData
} from '$lib/util/testing/testing';
import type { HydratedDocument } from 'mongoose';
import { ulid } from 'ulid';

beforeAll(async () => {
	await connectDatabase();
});

describe('permissions', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('update permission', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		await createDBUser(testUserOneSession);
		const testUserTwoDB = await createDBUser(testUserTwoSession);

		const createBookResponse = await createBook(testUserOneSession, testBookTitle);
		let permissions = createBookResponse.data.permissions;

		permissions[testUserTwoSession.user.id] = {
			_id: ulid(),
			user: testUserTwoDB.data._id,
			permission: 'collaborate'
		} as HydratedDocument<PermissionProperties>;

		// create a new permission
		const caller = router.createCaller({ session: testUserOneSession });
		let updatedBookResponse = await caller.books.update({
			id: createBookResponse.data._id,
			permissions
		});

		expect(updatedBookResponse.data.permissions[testUserTwoSession.user.id]?.permission).toEqual(
			'collaborate'
		);

		permissions = updatedBookResponse.data.permissions;

		permissions[testUserTwoSession.user.id] = {
			_id: ulid(),
			user: testUserTwoDB.data._id,
			permission: 'view'
		} as HydratedDocument<PermissionProperties>;

		updatedBookResponse = await caller.books.update({
			id: createBookResponse.data._id,
			permissions: permissions
		});

		expect(updatedBookResponse.data.permissions[testUserTwoSession.user.id]?.permission).toEqual(
			'view'
		);
	});

	test('delete permission', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		await createDBUser(testUserOneSession);
		await createDBUser(createTestSession(generateUserSessionData()));

		const createBookResponse = await createBook(testUserOneSession, testBookTitle);
		let permissions = createBookResponse.data.permissions;

		permissions[testUserTwoSession.user.id] = {
			_id: ulid(),
			user: testUserTwoSession.user.id,
			permission: 'collaborate'
		} as HydratedDocument<PermissionProperties>;

		// create a new permission
		const caller = router.createCaller({ session: testUserOneSession });
		let updatedBookResponse = await caller.books.update({
			id: createBookResponse.data._id,
			permissions: permissions
		});

		expect(updatedBookResponse.data.permissions[testUserTwoSession.user.id]?.permission).toEqual(
			'collaborate'
		);

		// delete permission
		permissions = updatedBookResponse.data.permissions;
		delete permissions[testUserTwoSession.user.id];

		updatedBookResponse = await caller.books.update({
			id: createBookResponse.data._id,
			permissions: permissions
		});

		expect(updatedBookResponse.data.permissions[testUserTwoSession.user.id]).toEqual(undefined);
	});

	test('test permission', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		await createDBUser(testUserOneSession);
		await createDBUser(testUserTwoSession);

		const createBookResponse = await createBook(testUserOneSession, testBookTitle);

		let caller = router.createCaller({ session: testUserOneSession });
		let storylines = (
			await caller.storylines.get({
				bookID: createBookResponse.data._id
			})
		).data;

		let chapter1Response = await createChapter(
			testUserOneSession,
			'Chapter 1',
			'My chapter 1',
			storylines[0]
		);

		// Update chapter permissions and check delta permissions
		let permissions = chapter1Response.data.permissions;
		permissions['public'] = {
			_id: 'public',
			permission: 'view'
		} as HydratedDocument<PermissionProperties>;

		chapter1Response = await caller.chapters.update({
			id: chapter1Response.data._id,
			permissions: permissions
		});

		const delta1Response = await caller.deltas.getById({
			id: chapter1Response.data.delta as string
		});

		expect(delta1Response.data.permissions?.public.permission).toEqual('view');

		// update chapter to be private
		permissions = chapter1Response.data.permissions;
		delete permissions['public'];

		chapter1Response = await caller.chapters.update({
			id: chapter1Response.data._id,
			permissions: permissions
		});

		expect(chapter1Response.data.userPermissions?.view).toEqual(true);

		caller = router.createCaller({ session: testUserTwoSession });

		storylines = (
			await caller.storylines.get({
				bookID: createBookResponse.data._id
			})
		).data;

		let storylineChapters = await caller.chapters.getByStoryline({
			storylineID: storylines[0]._id,
			storylineChapterIDs: storylines[0].chapters as string[]
		});

		expect(storylineChapters.data[0].userPermissions?.view).toEqual(false);

		// update storyline to be private
		permissions = storylines[0].permissions;
		delete permissions['public'];

		caller = router.createCaller({ session: testUserOneSession });
		await caller.storylines.update({
			id: storylines[0]._id,
			permissions: permissions
		});

		caller = router.createCaller({ session: testUserTwoSession });
		storylineChapters = await caller.chapters.getByStoryline({
			storylineID: storylines[0]._id,
			storylineChapterIDs: storylines[0].chapters as string[]
		});

		expect(storylineChapters.data.length).toEqual(0);
	});
});
