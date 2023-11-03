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
				bookID: bookResponse._id
			})
		).result;

		caller = router.createCaller({ session: testUserOneSession });
		const chapter1Response = await caller.chapters.create({
			title: chapter1Title,
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id
		});

		const chapter2_1Response = await caller.chapters.create({
			title: chapter2_1Title,
			description: 'My chapter 2',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id,
			prevChapterID: chapter1Response._id
		});

		const chapter3_1Response = await caller.chapters.create({
			title: chapter3_1Title,
			description: 'My chapter 3',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id,
			prevChapterID: chapter2_1Response._id
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
			book: bookResponse._id,
			parent: storylines[0]._id,
			parentChapter: chapter1Response._id,
			permissions: {
				public: publicPermission
			}
		});

		// let user one create chapter on user one storyline
		caller = router.createCaller({ session: testUserOneSession });
		const chapter2_2Response = await caller.chapters.create({
			title: chapter2_2Title,
			description: 'My chapter 2',
			storylineID: storyline2._id,
			bookID: bookResponse._id,
			prevChapterID: chapter1Response._id,
			permissions: {
				public:
					new PermissionPropertyBuilder().getProperties() as HydratedDocument<PermissionProperties>
			}
		});

		storyline2 = await caller.storylines.getById({
			storylineID: storyline2._id
		});

		const storyline_2Chapters = await caller.chapters.getByStoryline({
			storylineID: storyline2._id,
			storylineChapterIDs: storyline2.chapters as string[]
		});

		expect(chapter1Response.title).toEqual(chapter1Title);
		expect(chapter2_1Response.title).toEqual(chapter2_1Title);

		expect(storyline_1Chapters.result[0].title).toEqual(chapter1Title);
		expect(storyline_1Chapters.result[1].title).toEqual(chapter2_1Title);

		// storyline 2 should have 2 chapters with the last being the branched off chapter
		// bookResponses.map((a) => a._id).sort()
		expect(storyline_2Chapters.map((a) => a.title).sort()[0]).toEqual(chapter1Title);
		expect(storyline_2Chapters.map((a) => a.title).sort()[1]).toEqual(chapter2_2Title);
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
				bookID: book._id
			})
		).result[0];

		const userOneChapter = await createChapter(
			sessionOne,
			"UserOne's Chapter 1",
			'Chapter 1',
			userOneMainStoryline
		);

		const userOneSecondStoryline = await callerOne.storylines.create({
			title: 'Storyline 2',
			description: 'Storyline 2',
			book: book._id,
			parent: userOneMainStoryline._id,
			parentChapter: userOneChapter._id
		});

		const userTwoStoryline = await callerTwo.storylines.create({
			title: 'Storyline 2',
			description: 'Storyline 2',
			book: book._id,
			parent: userOneMainStoryline._id,
			parentChapter: userOneChapter._id
		});

		const userTwoChapter = await createChapter(
			sessionTwo,
			"UserTwo's Chapter 1",
			'The Spin-off Chapter 1',
			userTwoStoryline
		);

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
			(await callerOne.storylines.getById({ storylineID: userOneMainStoryline._id })).archived
		).toEqual(true);
		expect(
			(await callerOne.storylines.getById({ storylineID: userOneSecondStoryline._id })).archived
		).toEqual(true);
		expect(
			(await callerTwo.storylines.getById({ storylineID: userTwoStoryline._id })).archived
		).toEqual(false);

		// Check archived changed only for user one's chapters
		expect((await callerOne.chapters.getById({ id: userOneChapter._id })).archived).toEqual(true);
		expect((await callerTwo.chapters.getById({ id: userTwoChapter._id })).archived).toEqual(false);
	});
});
