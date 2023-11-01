import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	testUserOne,
	createBook,
	createChapter
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('chapters', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create chapters', async () => {
		const testBookTitle = 'My Book';
		const chapter1Title = 'Chapter 1';
		const chapter2Title = 'Chapter 2';

		const testUserOneSession = createTestSession(testUserOne);
		const user = await createDBUser(testUserOneSession);

		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		const caller = router.createCaller({ session: testUserOneSession });
		let storylines = (
			await caller.storylines.get({
				bookID: bookResponse._id
			})
		).result;

		const chapter1Response = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		const chapter2Response = await createChapter(
			testUserOneSession,
			chapter2Title,
			'My chapter 2',
			storylines[0],
			chapter1Response._id
		);

		storylines = (
			await caller.storylines.get({
				bookID: bookResponse._id
			})
		).result;

		let storylineChapters = await caller.chapters.getByStoryline({
			storylineID: storylines[0]._id,
			storylineChapterIDs: storylines[0].chapters as string[]
		});

		const chapter1Delta = await caller.deltas.getById({ id: chapter1Response.delta as string });
		const chapter2Delta = await caller.deltas.getById({ id: chapter2Response.delta as string });

		expect(chapter1Response.title).toEqual(chapter1Title);
		expect(chapter2Response.title).toEqual(chapter2Title);
		expect(chapter1Delta.permissions).toEqual(chapter1Response.permissions);
		expect(chapter2Delta.permissions).toEqual(chapter2Response.permissions);
		expect(
			typeof chapter2Response.user === 'string' ? chapter2Response.user : chapter2Response.user?._id
		).toEqual(user._id);
		expect(storylineChapters[0].title).toEqual(chapter1Title);

		// Get up to a certain point
		storylineChapters = await caller.chapters.getByStoryline({
			storylineID: storylines[0]._id,
			storylineChapterIDs: storylines[0].chapters as string[],
			toChapterID: chapter1Response._id
		});

		expect(storylineChapters.length).toEqual(1);
	});

	test('update chapters', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';

		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse._id
			})
		).result;

		const chapterCreateResponse = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		expect(chapterCreateResponse.description).toEqual('My chapter 1');

		const chapterUpdateResponse = await caller.chapters.update({
			id: chapterCreateResponse._id,
			description: 'Updated chapter 1'
		});

		expect(chapterUpdateResponse.description).toEqual('Updated chapter 1');
	});

	test('delete chapters', async () => {
		const testBookTitle = 'My Book';
		const chapter1Title = 'Chapter 1';
		const chapter2Title = 'Chapter 2';
		const chapter3Title = 'Chapter 3';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		let caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse._id
			})
		).result;

		caller = router.createCaller({ session: createTestSession(testUserOne) });

		const chapter1Response = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		const chapter2Response = await createChapter(
			testUserOneSession,
			chapter2Title,
			'My chapter 2',
			storylines[0],
			chapter1Response._id
		);

		const chapter3Response = await createChapter(
			testUserOneSession,
			chapter3Title,
			'My chapter 3',
			storylines[0],
			chapter2Response._id
		);

		const chapter2DeleteResponse = await caller.chapters.delete({
			id: chapter2Response._id
		});

		let storylineChapters = (
			await caller.chapters.get({
				storylineChapterIDs: storylines[0].chapters as string[]
			})
		).result;

		expect(storylineChapters.length).toEqual(2);
		expect(chapter2DeleteResponse.deletedCount).toEqual(1);

		const chapter3DeleteResponse = await caller.chapters.delete({
			id: chapter3Response._id
		});

		storylineChapters = (
			await caller.chapters.get({
				storylineChapterIDs: storylines[0].chapters as string[]
			})
		).result;

		expect(storylineChapters.length).toEqual(1);
		expect(chapter3DeleteResponse.deletedCount).toEqual(1);
	});
});
