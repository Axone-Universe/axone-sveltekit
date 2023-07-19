import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createUser,
	testSession,
	testUser,
	testUserInfo
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('users', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create user', async () => {
		const userResponse = await createUser(testSession);

		expect(userResponse._id).toEqual(testSession.user.id);
		expect(userResponse.firstName).toEqual(testUserInfo.firstName);
		expect(userResponse.lastName).toEqual(testUserInfo.lastName);
	});

	test('get all users', async () => {
		const testUser1 = { ...testUser };
		testUser1.id = '1';
		const testSession1 = { ...testSession };
		testSession1.user = testUser1;

		const testUser2 = { ...testUser };
		testUser2.id = '2';
		const testSession2 = { ...testSession };
		testSession2.user = testUser2;

		const userResponse1 = await createUser(testSession1);
		const userResponse2 = await createUser(testSession2);

		const caller = router.createCaller({ session: null });
		const userResponses = await caller.users.list();

		// compare sorted arrays to ignore element position differences (if any)
		expect(userResponses.map((a) => a._id).sort()).toEqual(
			[userResponse1._id, userResponse2._id].sort()
		);
	});

	test('get single user', async () => {
		const testUser1 = { ...testUser };
		testUser1.id = '1';
		const testSession1 = { ...testSession };
		testSession1.user = testUser1;

		const testUser2 = { ...testUser };
		testUser2.id = '2';
		const testSession2 = { ...testSession };
		testSession2.user = testUser2;

		const userResponse = await createUser(testSession1);
		await createUser(testSession2);

		const caller = router.createCaller({ session: null });
		const userResponses = await caller.users.list({ searchTerm: userResponse._id });

		const user = userResponses[0];

		expect(userResponses.length).toEqual(1);
		expect(user!._id).toEqual(userResponse._id);
	});
});
