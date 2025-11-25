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
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const testUserTwoDB = (await createDBUser(testSessionTwo)).data;

		const caller = router.createCaller({ session: null, user: testUserOneDB });
		const userResponses = await caller.users.get({});

		// compare sorted arrays to ignore element position differences (if any)
		expect(userResponses.data.map((a) => a._id).sort()).toEqual(
			[testUserOneDB._id, testUserTwoDB._id].sort()
		);
	});

	test('get by details', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const testUserTwoDB = (await createDBUser(testSessionTwo)).data;

		const caller = router.createCaller({ session: null, user: testUserOneDB });
		const userResponses = await caller.users.get({ detail: userTwo.email });

		// compare sorted arrays to ignore element position differences (if any)
		expect(userResponses.data.map((a) => a._id).sort()).toEqual([testUserTwoDB._id].sort());
	});

	test('update user details', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;

		const caller = router.createCaller({ session: testSessionOne, user: testUserOneDB });
		const updateUserResponse = await caller.users.update({
			facebook: 'www.facebook.com/user1'
		});

		expect(updateUserResponse.data?.facebook).toEqual('www.facebook.com/user1');
	});

	test('get single user', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const testUserTwoDB = (await createDBUser(testSessionTwo)).data;

		const caller = router.createCaller({ session: null, user: testUserOneDB });
		const userResponse = await caller.users.getById({ id: testUserOneDB._id });

		expect(userResponse.data!._id).toEqual(testUserOneDB._id);
	});

	test('create reading list', async () => {
		const favourites = 'Favourites';

		const testUserOneDB = (await createDBUser(testSessionOne)).data;

		const caller = router.createCaller({ session: testSessionOne, user: testUserOneDB });

		const response = await caller.users.createReadingList({ name: favourites });
		expect(Object.fromEntries(response.data!.readingLists!.entries())).toEqual({
			All: [],
			Favourites: []
		});
	});

	test('throws on creating a reading list with same name', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const caller = router.createCaller({ session: testSessionOne, user: testUserOneDB });

		const createResponse = await caller.users.createReadingList({ name: DEFAULT_READING_LIST });
		expect(createResponse.message.includes('duplicate key error')).toEqual(true);
	});

	test('delete reading list', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const caller = router.createCaller({ session: testSessionOne, user: testUserOneDB });

		const res = await caller.users.deleteReadingList({ name: DEFAULT_READING_LIST });

		expect(Object.fromEntries(res.data!.readingLists!.entries())).toEqual({});
	});

	test('update reading lists', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const caller = router.createCaller({ session: testSessionOne, user: testUserOneDB });

		const bookResponse = await createBook(testSessionOne, testUserOneDB, 'My Book');
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
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const caller = router.createCaller({ session: testSessionOne, user: testUserOneDB });

		const favourites = 'Favourites';

		await caller.users.createReadingList({ name: favourites });

		const bookResponse = await createBook(testSessionOne, testUserOneDB, 'My Book');
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
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const caller = router.createCaller({ session: testSessionOne, user: testUserOneDB });
		const favourites = 'Favourites';

		const user = await caller.users.renameReadingList({
			oldName: DEFAULT_READING_LIST,
			newName: favourites
		});

		expect(Object.fromEntries(user.data!.readingLists!.entries())).toEqual({ Favourites: [] });
	});

	test('create user with referralSource - Cape Town Writers Network', async () => {
		const caller = router.createCaller({ session: testSessionOne, user: undefined });
		const userResponse = await caller.users.create({
			firstName: userOne.user_metadata.firstName,
			lastName: userOne.user_metadata.lastName,
			email: userOne.email,
			referralSource: "Cape Town Writers' Network"
		});

		expect(userResponse.data.referralSource).toEqual("Cape Town Writers' Network");
		expect(userResponse.data.referralAboutSource).toBeUndefined();
		expect(userResponse.data.referralSocialMediaSource).toEqual([]);
		expect(userResponse.data.referralUser).toBeUndefined();
	});

	test('create user with referralSource - Other and referralAboutSource', async () => {
		const caller = router.createCaller({ session: testSessionOne, user: undefined });
		const userResponse = await caller.users.create({
			firstName: userOne.user_metadata.firstName,
			lastName: userOne.user_metadata.lastName,
			email: userOne.email,
			referralSource: 'Other',
			referralAboutSource: 'Found through a friend at a book club'
		});

		expect(userResponse.data.referralSource).toEqual('Other');
		expect(userResponse.data.referralAboutSource).toEqual('Found through a friend at a book club');
		expect(userResponse.data.referralSocialMediaSource).toEqual([]);
		expect(userResponse.data.referralUser).toBeUndefined();
	});

	test('create user with referralSource - Social Media and referralSocialMediaSource', async () => {
		const caller = router.createCaller({ session: testSessionOne, user: undefined });
		const userResponse = await caller.users.create({
			firstName: userOne.user_metadata.firstName,
			lastName: userOne.user_metadata.lastName,
			email: userOne.email,
			referralSource: 'Social Media',
			referralSocialMediaSource: ['Instagram', 'TikTok']
		});

		expect(userResponse.data.referralSource).toEqual('Social Media');
		expect(userResponse.data.referralSocialMediaSource).toEqual(['Instagram', 'TikTok']);
		expect(userResponse.data.referralAboutSource).toBeUndefined();
		expect(userResponse.data.referralUser).toBeUndefined();
	});

	test('create user with referralSource - Referral and referralUser', async () => {
		const testUserTwoDB = (await createDBUser(testSessionTwo)).data;
		const caller = router.createCaller({ session: testSessionOne, user: undefined });
		const userResponse = await caller.users.create({
			firstName: userOne.user_metadata.firstName,
			lastName: userOne.user_metadata.lastName,
			email: userOne.email,
			referralSource: 'Referral',
			referralUser: testUserTwoDB._id
		});

		expect(userResponse.data.referralSource).toEqual('Referral');
		expect(userResponse.data.referralUser).toEqual(testUserTwoDB._id);
		expect(userResponse.data.referralAboutSource).toBeUndefined();
		expect(userResponse.data.referralSocialMediaSource).toEqual([]);
	});

	test('update user with referral fields', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const caller = router.createCaller({ session: testSessionOne, user: testUserOneDB });

		// Update with Google Search
		let updateResponse = await caller.users.update({
			referralSource: 'Google Search'
		});
		expect(updateResponse.data?.referralSource).toEqual('Google Search');

		// Update with Other and custom text
		updateResponse = await caller.users.update({
			referralSource: 'Other',
			referralAboutSource: 'Conference presentation'
		});
		expect(updateResponse.data?.referralSource).toEqual('Other');
		expect(updateResponse.data?.referralAboutSource).toEqual('Conference presentation');

		// Update with Social Media platforms
		updateResponse = await caller.users.update({
			referralSource: 'Social Media',
			referralSocialMediaSource: ['LinkedIn', 'Facebook']
		});
		expect(updateResponse.data?.referralSource).toEqual('Social Media');
		expect(updateResponse.data?.referralSocialMediaSource).toEqual(['LinkedIn', 'Facebook']);
	});

	test('update user referralSource clears unrelated referral fields', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const caller = router.createCaller({ session: testSessionOne, user: testUserOneDB });

		// First set Social Media with platforms
		await caller.users.update({
			referralSource: 'Social Media',
			referralSocialMediaSource: ['Instagram']
		});

		// Then update to Google Search (should clear social media sources)
		const updateResponse = await caller.users.update({
			referralSource: 'Google Search',
			referralSocialMediaSource: [],
			referralAboutSource: undefined,
			referralUser: undefined
		});

		expect(updateResponse.data?.referralSource).toEqual('Google Search');
		expect(updateResponse.data?.referralSocialMediaSource).toEqual([]);
		expect(updateResponse.data?.referralAboutSource).toBeUndefined();
		expect(updateResponse.data?.referralUser).toBeUndefined();
	});

	test('get referral count - no referrals', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const caller = router.createCaller({ session: testSessionOne, user: testUserOneDB });

		const response = await caller.users.getReferralCount();

		expect(response.success).toEqual(true);
		expect(response.data.count).toEqual(0);
	});

	test('get referral count - with referrals', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const testUserTwoDB = (await createDBUser(testSessionTwo)).data;

		// Create users referred by testUserOne
		const referredUser1Session = createTestSession(generateUserSessionData());
		const referredUser2Session = createTestSession(generateUserSessionData());
		const referredUser3Session = createTestSession(generateUserSessionData());

		// Create users with referralUser set to testUserOne's ID
		const caller = router.createCaller({ session: referredUser1Session, user: undefined });
		await caller.users.create({
			firstName: referredUser1Session.user.user_metadata.firstName,
			lastName: referredUser1Session.user.user_metadata.lastName,
			email: referredUser1Session.user.email,
			referralSource: 'Referral',
			referralUser: testUserOneDB._id
		});

		const caller2 = router.createCaller({ session: referredUser2Session, user: undefined });
		await caller2.users.create({
			firstName: referredUser2Session.user.user_metadata.firstName,
			lastName: referredUser2Session.user.user_metadata.lastName,
			email: referredUser2Session.user.email,
			referralSource: 'Referral',
			referralUser: testUserOneDB._id
		});

		const caller3 = router.createCaller({ session: referredUser3Session, user: undefined });
		await caller3.users.create({
			firstName: referredUser3Session.user.user_metadata.firstName,
			lastName: referredUser3Session.user.user_metadata.lastName,
			email: referredUser3Session.user.email,
			referralSource: 'Referral',
			referralUser: testUserOneDB._id
		});

		// Get referral count for testUserOne
		const mainCaller = router.createCaller({ session: testSessionOne, user: testUserOneDB });
		const response = await mainCaller.users.getReferralCount();

		expect(response.success).toEqual(true);
		expect(response.data.count).toEqual(3);
	});

	test('get referral count - only counts users with matching referralUser', async () => {
		const testUserOneDB = (await createDBUser(testSessionOne)).data;
		const testUserTwoDB = (await createDBUser(testSessionTwo)).data;

		// Create users referred by testUserOne
		const referredUser1Session = createTestSession(generateUserSessionData());
		const referredUser2Session = createTestSession(generateUserSessionData());

		// Create users with referralUser set to testUserOne's ID
		const caller1 = router.createCaller({ session: referredUser1Session, user: undefined });
		await caller1.users.create({
			firstName: referredUser1Session.user.user_metadata.firstName,
			lastName: referredUser1Session.user.user_metadata.lastName,
			email: referredUser1Session.user.email,
			referralSource: 'Referral',
			referralUser: testUserOneDB._id
		});

		// Create user with referralUser set to testUserTwo's ID (should not be counted)
		const caller2 = router.createCaller({ session: referredUser2Session, user: undefined });
		await caller2.users.create({
			firstName: referredUser2Session.user.user_metadata.firstName,
			lastName: referredUser2Session.user.user_metadata.lastName,
			email: referredUser2Session.user.email,
			referralSource: 'Referral',
			referralUser: testUserTwoDB._id
		});

		// Get referral count for testUserOne - should only count 1
		const mainCaller = router.createCaller({ session: testSessionOne, user: testUserOneDB });
		const response = await mainCaller.users.getReferralCount();

		expect(response.success).toEqual(true);
		expect(response.data.count).toEqual(1);
	});

	// TODO: test cascading deletes of storylines
});
