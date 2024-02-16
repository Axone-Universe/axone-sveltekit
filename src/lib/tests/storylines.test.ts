import { PermissionPropertyBuilder, type PermissionProperties } from '$lib/properties/permission';
import { router } from '$lib/trpc/router';
import {
	cleanUpDatabase,
	connectTestDatabase,
	createDBUser,
	createBook,
	createTestSession,
	testUserOne,
	testUserTwo,
	testUserThree,
	createChapter
} from '$lib/util/testing/testing';
import type { HydratedDocument } from 'mongoose';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('storylines', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create storylines', async () => {
		const testBookTitle = 'My Book';
		const chapter1Title = 'Chapter 1';
		const chapter2_1Title = 'Chapter 2_1';
		const chapter3_1Title = 'Chapter 3_1';
		const chapter2_2Title = 'Chapter 2_2';

		const testUserOneSession = createTestSession(testUserOne);
		const testUserTwoSession = createTestSession(testUserTwo);

		await createDBUser(testUserOneSession);
		await createDBUser(testUserTwoSession);

		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		let caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		caller = router.createCaller({ session: testUserOneSession });
		const chapter1Response = await caller.chapters.create({
			title: chapter1Title,
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse.data._id
		});

		const chapter2_1Response = await caller.chapters.create({
			title: chapter2_1Title,
			description: 'My chapter 2',
			storylineID: storylines[0]._id,
			bookID: bookResponse.data._id,
			prevChapterID: chapter1Response.data._id
		});

		const chapter3_1Response = await caller.chapters.create({
			title: chapter3_1Title,
			description: 'My chapter 3',
			storylineID: storylines[0]._id,
			bookID: bookResponse.data._id,
			prevChapterID: chapter2_1Response.data._id
		});

		const storyline_1Chapters = await caller.chapters.get({
			storylineChapterIDs: storylines[0].chapters as string[]
		});

		// Create a new storyline using user 2
		caller = router.createCaller({ session: testUserTwoSession });

		const publicPermission =
			new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>;
		publicPermission.permission = 'collaborate';
		let storyline2 = await caller.storylines.create({
			title: 'Storyline 2',
			description: 'Storyline 2',
			book: bookResponse.data._id,
			parent: storylines[0]._id,
			parentChapter: chapter1Response.data._id,
			permissions: {
				public: publicPermission
			}
		});

		// let user one create chapter on user one storyline
		caller = router.createCaller({ session: testUserOneSession });
		const chapter2_2Response = await caller.chapters.create({
			title: chapter2_2Title,
			description: 'My chapter 2',
			storylineID: storyline2.data._id,
			bookID: bookResponse.data._id,
			prevChapterID: chapter1Response.data._id,
			permissions: {
				public:
					new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>
			}
		});

		storyline2 = await caller.storylines.getById({
			id: storyline2.data._id
		});

		const storyline_2Chapters = (
			await caller.chapters.getByStoryline({
				storylineID: storyline2.data._id,
				storylineChapterIDs: storyline2.data.chapters as string[]
			})
		).data;

		expect(chapter1Response.data.title).toEqual(chapter1Title);
		expect(chapter2_1Response.data.title).toEqual(chapter2_1Title);

		expect(storyline_1Chapters.data[0].title).toEqual(chapter1Title);
		expect(storyline_1Chapters.data[1].title).toEqual(chapter2_1Title);

		// storyline 2 should have 2 chapters with the last being the branched off chapter
		// bookResponses.map((a) => a._id).sort()
		expect(storyline_2Chapters.map((a) => a.title).sort()[0]).toEqual(chapter1Title);
		expect(storyline_2Chapters.map((a) => a.title).sort()[1]).toEqual(chapter2_2Title);
	});

	test('get storylines by genres', async () => {
		await createDBUser(createTestSession(testUserOne));
		await createDBUser(createTestSession(testUserTwo));
		await createDBUser(createTestSession(testUserThree));

		const bookResponse1 = await createBook(createTestSession(testUserOne), '', [
			'Action',
			'Adventure'
		]);
		const bookResponse2 = await createBook(createTestSession(testUserTwo), '', [
			'Action',
			'Adventure',
			'Fantasy'
		]);
		await createBook(createTestSession(testUserThree), '', ['Action', 'Dystopian']);

		const caller = router.createCaller({ session: null });
		const storylineResponses = await caller.storylines.get({ genres: ['Action', 'Adventure'] });

		expect(
			storylineResponses.data.map((a) => (typeof a.book === 'string' ? a.book : a.book!._id)).sort()
		).toEqual([bookResponse1.data._id, bookResponse2.data._id].sort());
	});

	test('updating archived status', async () => {
		const sessionOne = createTestSession(testUserOne);
		const sessionTwo = createTestSession(testUserTwo);
		await createDBUser(sessionOne);
		await createDBUser(sessionTwo);
		const book = await createBook(sessionOne);

		const callerOne = router.createCaller({ session: sessionOne });
		const callerTwo = router.createCaller({ session: sessionTwo });

		const userOneMainStoryline = (
			await callerOne.storylines.get({
				bookID: book.data._id
			})
		).data[0];

		const userOneChapter = (
			await createChapter(sessionOne, "UserOne's Chapter 1", 'Chapter 1', userOneMainStoryline)
		).data;

		const userOneSecondStoryline = (
			await callerOne.storylines.create({
				title: 'Storyline 2',
				description: 'Storyline 2',
				book: book.data._id,
				parent: userOneMainStoryline._id,
				parentChapter: userOneChapter._id
			})
		).data;

		const userTwoStoryline = (
			await callerTwo.storylines.create({
				title: 'Storyline 2',
				description: 'Storyline 2',
				book: book.data._id,
				parent: userOneMainStoryline._id,
				parentChapter: userOneChapter._id
			})
		).data;

		const userTwoChapter = (
			await createChapter(
				sessionTwo,
				"UserTwo's Chapter 1",
				'The Spin-off Chapter 1',
				userTwoStoryline
			)
		).data;

		// Check archived before updating
		expect(userOneMainStoryline.archived).toEqual(false);
		expect(userOneSecondStoryline.archived).toEqual(false);
		expect(userTwoStoryline.archived).toEqual(false);
		expect(userOneChapter.archived).toEqual(false);
		expect(userTwoChapter.archived).toEqual(false);

		// Archive user one's storylines
		await callerOne.storylines.setArchived({
			ids: [userOneMainStoryline._id, userOneSecondStoryline._id],
			archived: true
		});

		// Check archived changed only for user one's storylines
		expect(
			(await callerOne.storylines.getById({ id: userOneMainStoryline._id })).data.archived
		).toEqual(true);
		expect(
			(await callerOne.storylines.getById({ id: userOneSecondStoryline._id })).data.archived
		).toEqual(true);
		expect(
			(await callerTwo.storylines.getById({ id: userTwoStoryline._id })).data.archived
		).toEqual(false);

		// Check archived changed only for user one's chapters
		expect((await callerOne.chapters.getById({ id: userOneChapter._id })).data.archived).toEqual(
			true
		);
		expect((await callerTwo.chapters.getById({ id: userTwoChapter._id })).data.archived).toEqual(
			false
		);
	});

	test('delete storyline', async () => {
		await createDBUser(createTestSession(testUserOne));
		const testBookTitle1 = 'My Book 1';
		const testUserOneSession = createTestSession(testUserOne);
		const createBookResponse = await createBook(testUserOneSession, testBookTitle1);

		const caller = router.createCaller({ session: testUserOneSession });

		const storylines = (
			await caller.storylines.get({
				bookID: createBookResponse.data._id
			})
		).data;

		const chapter1Response = await createChapter(
			testUserOneSession,
			'Chapter 1',
			'My chapter 1',
			storylines[0]
		);

		let deleteStorylineResponse = await caller.storylines.delete({ id: storylines[0]._id });

		expect(deleteStorylineResponse.success).toEqual(false);
		expect(deleteStorylineResponse.message).toContain(
			'Please delete all chapters before deleting the storyline'
		);

		// delete the chapter
		const deleteChapterResponse = await caller.chapters.delete({
			id: chapter1Response.data._id
		});

		expect(deleteChapterResponse.success).toEqual(true);

		// delete the storyline again
		deleteStorylineResponse = await caller.storylines.delete({ id: storylines[0]._id });

		expect(deleteStorylineResponse.success).toEqual(true);
		expect(deleteStorylineResponse.message).toContain('storyline successfully deleted');
	});
});
