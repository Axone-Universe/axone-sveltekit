import { router } from '$lib/trpc/router';
import { cleanUpDatabase, createUser, testSession, testUser } from '$lib/util/testing';

describe('users', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create user', async () => {
		const user = await createUser(testSession);

		expect(user).toEqual({
			id: testSession.user.id,
			name: testSession.user.user_metadata.name,
			email: testSession.user.email
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

		const user1 = await createUser(testSession1);
		const user2 = await createUser(testSession2);

		const caller = router.createCaller({ session: null });
		const users = await caller.users.list();

		// compare sorted arrays to ignore element position differences (if any)
		expect(users.map((a) => a.id).sort()).toEqual([user1.id, user2.id].sort());
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

		const user1 = await createUser(testSession1);
		await createUser(testSession2);

		const caller = router.createCaller({ session: null });
		const users = await caller.users.list(user1.id);

		expect(users.length).toEqual(1);
		expect(users.pop()).toEqual(user1);
	});
});
