import { router } from '$lib/trpc/router';
import {
	cleanUpDatabase,
	createUser,
	testSession,
	testUser,
	testUserInfo
} from '$lib/util/testing/testing';

describe('users', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create user', async () => {
		const userResponse = await createUser(testSession);

		expect(userResponse.user.properties).toEqual({
			id: testSession.user.id,
			firstName: testUserInfo.firstName,
			lastName: testUserInfo.lastName
		});
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
		expect(userResponses.map((a) => a.user.properties.id).sort()).toEqual(
			[userResponse1.user.properties.id, userResponse2.user.properties.id].sort()
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
		const userResponses = await caller.users.list({ searchTerm: userResponse.user.properties.id });

		expect(userResponses.length).toEqual(1);
		expect(userResponses.pop()).toEqual(userResponse);
	});
});
