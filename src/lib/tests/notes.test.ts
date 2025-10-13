import { router } from '$lib/trpc/router';
import {
	cleanUpDatabase,
	connectDatabase,
	createDBUser,
	createBook,
	createTestSession,
	createChapter,
	generateUserSessionData
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectDatabase();
});

describe('notes', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('update notes', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(generateUserSessionData());

		const testUserOneDB = (await createDBUser(testUserOneSession)).data;

		const bookResponse = await createBook(testUserOneSession, testUserOneDB, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// create chapter on default storyline
		const createChapterResponse = await createChapter(
			testUserOneSession,
			testUserOneDB,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		expect(createChapterResponse.data.description).toEqual('My chapter 1');

		const noteCreateResponse = await caller.notes.create({
			chapterID: createChapterResponse.data._id,
			title: 'Peya',
			note: 'Peya is a girl with a sweet and unassuming character',
			tags: ['character']
		});

		expect(noteCreateResponse.data.note).toEqual(
			'Peya is a girl with a sweet and unassuming character'
		);

		const noteUpdateResponse = await caller.notes.update({
			id: noteCreateResponse.data._id,
			note: 'Peya has a strong and resilient character'
		});

		expect(noteUpdateResponse.data.note).toEqual('Peya has a strong and resilient character');
	});

	test('delete notes', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(generateUserSessionData());

		const testUserOneDB = (await createDBUser(testUserOneSession)).data;

		const bookResponse = await createBook(testUserOneSession, testUserOneDB, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// create chapter on default storyline
		const createChapterResponse = await createChapter(
			testUserOneSession,
			testUserOneDB,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		expect(createChapterResponse.data.description).toEqual('My chapter 1');

		const noteCreateResponse = await caller.notes.create({
			chapterID: createChapterResponse.data._id,
			title: 'Peya',
			note: 'Peya is a girl with a sweet and unassuming character',
			tags: ['character']
		});

		expect(noteCreateResponse.data.note).toEqual(
			'Peya is a girl with a sweet and unassuming character'
		);

		await caller.notes.delete({
			id: noteCreateResponse.data._id
		});

		const chapterNotes = await caller.notes.getByChapterID({
			chapterID: createChapterResponse.data._id
		});

		expect(chapterNotes.data.length).toEqual(0);
	});
});
