import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	testUserOne,
	testUserTwo
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('users', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create user', async () => {
		const testSessionOne = createTestSession(testUserOne);
		const userResponse = await createDBUser(testSessionOne);

		expect(userResponse._id).toEqual(testSessionOne.user.id);
		expect(userResponse.firstName).toEqual(testUserOne.user_metadata.firstName);
		expect(userResponse.lastName).toEqual(testUserOne.user_metadata.lastName);
	});

	test('get all users', async () => {
		const testSessionOne = createTestSession(testUserOne);
		const testSessionTwo = createTestSession(testUserTwo);

		const userResponse1 = await createDBUser(testSessionOne);
		const userResponse2 = await createDBUser(testSessionTwo);

		const caller = router.createCaller({ session: null });
		const userResponses = await caller.users.list({});

		// compare sorted arrays to ignore element position differences (if any)
		expect(userResponses.map((a) => a._id).sort()).toEqual(
			[userResponse1._id, userResponse2._id].sort()
		);
	});

	test('get by details', async () => {
		const testSessionOne = createTestSession(testUserOne);
		const testSessionTwo = createTestSession(testUserTwo);

		await createDBUser(testSessionOne);
		const userResponse2 = await createDBUser(testSessionTwo);

		const caller = router.createCaller({ session: null });
		const userResponses = await caller.users.getByDetails({ detail: 'user_t' });

		// compare sorted arrays to ignore element position differences (if any)
		expect(userResponses.map((a) => a._id).sort()).toEqual([userResponse2._id].sort());
	});

	test('update user details', async () => {
		const testSessionOne = createTestSession(testUserOne);
		const testSessionTwo = createTestSession(testUserTwo);

		await createDBUser(testSessionOne);
		const userResponse2 = await createDBUser(testSessionTwo);

		const caller = router.createCaller({ session: testSessionOne });
		const updateUserResponse = await caller.users.update({
			_id: userResponse2._id,
			facebook: 'www.facebook.com/user1'
		});

		// compare sorted arrays to ignore element position differences (if any)
		expect(updateUserResponse.facebook).toEqual('www.facebook.com/user1');
	});

	test('get single user', async () => {
		const testSessionOne = createTestSession(testUserOne);
		const testSessionTwo = createTestSession(testUserTwo);

		const createUserResponse = await createDBUser(testSessionOne);
		await createDBUser(testSessionTwo);

		const caller = router.createCaller({ session: null });
		const userResponse = await caller.users.getById({ id: createUserResponse._id });

		expect(userResponse!._id).toEqual(createUserResponse._id);
	});
});
