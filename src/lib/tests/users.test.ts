import { DEFAULT_READING_LIST } from '$lib/properties/user';
import { router } from '$lib/trpc/router';
import {
	connectDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	generateUserSessionData,
	createBook
} from '$lib/util/testing/testing';
import * as novu from '$lib/util/notifications/novu';

beforeAll(async () => {
	await connectDatabase();
});

describe('users', () => {
	const userOne = generateUserSessionData();
	const userTwo = generateUserSessionData();
	const testSessionOne = createTestSession(userOne);
	const testSessionTwo = createTestSession(userTwo);

	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create user', async () => {
		const mock = vi.spyOn(novu, 'createNotificationSubscriber');
		const userResponse = await createDBUser(testSessionOne);

		expect(mock).toHaveBeenCalled();
		expect(userResponse.data._id).toEqual(testSessionOne.user.id);
		expect(userResponse.data.firstName).toEqual(userOne.user_metadata.firstName);
		expect(userResponse.data.lastName).toEqual(userOne.user_metadata.lastName);
	});

	test('get all users', async () => {
		const userResponse1 = await createDBUser(testSessionOne);
		const userResponse2 = await createDBUser(testSessionTwo);

		const caller = router.createCaller({ session: null });
		const userResponses = await caller.users.get({});

		// compare sorted arrays to ignore element position differences (if any)
		expect(userResponses.data.map((a) => a._id).sort()).toEqual(
			[userResponse1.data._id, userResponse2.data._id].sort()
		);
	});

	test('get by details', async () => {
		await createDBUser(testSessionOne);
		const userResponse2 = await createDBUser(testSessionTwo);

		const caller = router.createCaller({ session: null });
		const userResponses = await caller.users.get({ detail: userTwo.email });

		// compare sorted arrays to ignore element position differences (if any)
		expect(userResponses.data.map((a) => a._id).sort()).toEqual([userResponse2.data._id].sort());
	});

	test('update user details', async () => {
		await createDBUser(testSessionOne);

		const caller = router.createCaller({ session: testSessionOne });
		const updateUserResponse = await caller.users.update({
			facebook: 'www.facebook.com/user1'
		});

		expect(updateUserResponse.data?.facebook).toEqual('www.facebook.com/user1');
	});

	test('get single user', async () => {
		const createUserResponse = await createDBUser(testSessionOne);
		await createDBUser(testSessionTwo);

		const caller = router.createCaller({ session: null });
		const userResponse = await caller.users.getById({ id: createUserResponse.data._id });

		expect(userResponse.data!._id).toEqual(createUserResponse.data._id);
	});

	test('create reading list', async () => {
		const favourites = 'Favourites';

		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		const response = await caller.users.createReadingList({ name: favourites });
		expect(Object.fromEntries(response.data!.readingLists!.entries())).toEqual({
			All: [],
			Favourites: []
		});
	});

	test('throws on creating a reading list with same name', async () => {
		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		const createResponse = await caller.users.createReadingList({ name: DEFAULT_READING_LIST });
		expect(createResponse.message.includes('duplicate key error')).toEqual(true);
	});

	test('delete reading list', async () => {
		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		const res = await caller.users.deleteReadingList({ name: DEFAULT_READING_LIST });

		expect(Object.fromEntries(res.data!.readingLists!.entries())).toEqual({});
	});

	test('update reading lists', async () => {
		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		const bookResponse = await createBook(testSessionOne, 'My Book');
		const storylines = [
			(
				await caller.storylines.get({
					bookID: bookResponse.data._id
				})
			).data[0]
		];

		await caller.users.createReadingList({ name: 'Favourites' });
		await caller.users.createReadingList({ name: 'Read Later' });

		let res = await caller.users.updateReadingLists({
			names: [DEFAULT_READING_LIST, 'Favourites'],
			storylineID: storylines[0]._id
		});

		expect(Object.fromEntries(res.data!.readingLists!.entries())).toEqual({
			All: [storylines[0]._id],
			Favourites: [storylines[0]._id],
			'Read Later': []
		});

		res = await caller.users.updateReadingLists({
			names: ['Read Later', 'Favourites'],
			storylineID: storylines[0]._id
		});

		expect(Object.fromEntries(res.data!.readingLists!.entries())).toEqual({
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
					bookID: bookResponse.data._id
				})
			).data[0]
		];

		await caller.users.updateReadingLists({
			names: [DEFAULT_READING_LIST],
			storylineID: storylines[0]._id
		});

		const res = await caller.users.getReadingList({ name: DEFAULT_READING_LIST });

		expect(res.data.length).toEqual(1);
		expect(res.data[0]._id).toEqual(storylines[0]._id);
	});

	test('rename reading list', async () => {
		const caller = router.createCaller({ session: testSessionOne });
		await createDBUser(testSessionOne);

		const favourites = 'Favourites';

		const user = await caller.users.renameReadingList({
			oldName: DEFAULT_READING_LIST,
			newName: favourites
		});

		expect(Object.fromEntries(user.data!.readingLists!.entries())).toEqual({ Favourites: [] });
	});

	// TODO: test cascading deletes of storylines
});
