import { DEFAULT_READING_LIST } from '$lib/properties/user';
import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	generateTestUser,
	createBook
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('users', () => {
	const userOne = generateTestUser();
	const userTwo = generateTestUser();
	const testSessionOne = createTestSession(userOne);
	const testSessionTwo = createTestSession(userTwo);

	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create user', async () => {
		const userResponse = await createDBUser(testSessionOne);

		expect(userResponse._id).toEqual(testSessionOne.user.id);
		expect(userResponse.firstName).toEqual(userOne.user_metadata.firstName);
		expect(userResponse.lastName).toEqual(userOne.user_metadata.lastName);
	});

	test('get all users', async () => {
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
		await createDBUser(testSessionOne);
		const userResponse2 = await createDBUser(testSessionTwo);

		const caller = router.createCaller({ session: null });
		const userResponses = await caller.users.getByDetails({ detail: userTwo.email });

		// compare sorted arrays to ignore element position differences (if any)
		expect(userResponses.map((a) => a._id).sort()).toEqual([userResponse2._id].sort());
	});

	test('update user details', async () => {
		await createDBUser(testSessionOne);

		const caller = router.createCaller({ session: testSessionOne });
		const updateUserResponse = await caller.users.update({
			facebook: 'www.facebook.com/user1'
		});

		expect(updateUserResponse?.facebook).toEqual('www.facebook.com/user1');
	});

	test('get single user', async () => {
		const createUserResponse = await createDBUser(testSessionOne);
		await createDBUser(testSessionTwo);

		const caller = router.createCaller({ session: null });
		const userResponse = await caller.users.getById({ id: createUserResponse._id });

		expect(userResponse!._id).toEqual(createUserResponse._id);
	});

	test('create reading list', async () => {
		const favourites = 'Favourites';

		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		const res = await caller.users.createReadingList({ name: favourites });

		expect(Object.fromEntries(res!.readingLists.entries())).toEqual({ All: [], Favourites: [] });
	});

	test('throws on creating a reading list with same name', async () => {
		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		expect(
			async () => await caller.users.createReadingList({ name: DEFAULT_READING_LIST })
		).rejects.toThrowError('duplicate key error');
	});

	test('delete reading list', async () => {
		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		const res = await caller.users.deleteReadingList({ name: DEFAULT_READING_LIST });

		expect(Object.fromEntries(res!.readingLists.entries())).toEqual({});
	});

	test('update reading lists', async () => {
		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		const bookResponse = await createBook(testSessionOne, 'My Book');
		const storylines = [
			(
				await caller.storylines.get({
					bookID: bookResponse._id
				})
			).result[0]
		];

		await caller.users.createReadingList({ name: 'Favourites' });
		await caller.users.createReadingList({ name: 'Read Later' });

		let res = await caller.users.updateReadingLists({
			names: [DEFAULT_READING_LIST, 'Favourites'],
			storylineID: storylines[0]._id
		});

		expect(Object.fromEntries(res!.readingLists.entries())).toEqual({
			All: [storylines[0]._id],
			Favourites: [storylines[0]._id],
			'Read Later': []
		});

		res = await caller.users.updateReadingLists({
			names: ['Read Later', 'Favourites'],
			storylineID: storylines[0]._id
		});

		expect(Object.fromEntries(res!.readingLists.entries())).toEqual({
			All: [],
			Favourites: [storylines[0]._id],
			'Read Later': [storylines[0]._id]
		});
	});

	test('get reading list', async () => {
		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		const favourites = 'Favourites';

		await caller.users.createReadingList({ name: favourites });

		const bookResponse = await createBook(testSessionOne, 'My Book');
		const storylines = [
			(
				await caller.storylines.get({
					bookID: bookResponse._id
				})
			).result[0]
		];

		await caller.users.updateReadingLists({
			names: [DEFAULT_READING_LIST],
			storylineID: storylines[0]._id
		});

		const res = await caller.users.getReadingList({ name: DEFAULT_READING_LIST });

		expect(res.length).toEqual(1);
		expect(res[0]._id).toEqual(storylines[0]._id);
	});

	test('rename reading list', async () => {
		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		const favourites = 'Favourites';

		const user = await caller.users.renameReadingList({
			oldName: DEFAULT_READING_LIST,
			newName: favourites
		});

		expect(Object.fromEntries(user!.readingLists.entries())).toEqual({ Favourites: [] });
	});

	// TODO: test cascading deletes of storylines
});
