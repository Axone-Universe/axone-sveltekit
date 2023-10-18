import { router } from '$lib/trpc/router';
import {
	cleanUpDatabase,
	connectTestDatabase,
	createDBUser,
	createBook,
	createTestSession,
	testUserOne,
	createChapter
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('notes', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('update notes', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = await caller.storylines.get({
			bookID: bookResponse._id
		});

		// create chapter on default storyline
		const createChapterResponse = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		expect(createChapterResponse.description).toEqual('My chapter 1');

		const noteCreateResponse = await caller.notes.create({
			chapterID: createChapterResponse._id,
			title: 'Peya',
			note: 'Peya is a girl with a sweet and unassuming character',
			tags: ['character']
		});

		expect(noteCreateResponse.note).toEqual('Peya is a girl with a sweet and unassuming character');

		const noteUpdateResponse = await caller.notes.update({
			id: noteCreateResponse._id,
			note: 'Peya has a strong and resilient character'
		});

		expect(noteUpdateResponse.note).toEqual('Peya has a strong and resilient character');
	});

	test('delete notes', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = await caller.storylines.get({
			bookID: bookResponse._id
		});

		// create chapter on default storyline
		const createChapterResponse = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		expect(createChapterResponse.description).toEqual('My chapter 1');

		const noteCreateResponse = await caller.notes.create({
			chapterID: createChapterResponse._id,
			title: 'Peya',
			note: 'Peya is a girl with a sweet and unassuming character',
			tags: ['character']
		});

		expect(noteCreateResponse.note).toEqual('Peya is a girl with a sweet and unassuming character');

		await caller.notes.delete({
			id: noteCreateResponse._id
		});

		const chapterNotes = await caller.notes.getByChapterID({
			chapterID: createChapterResponse._id
		});

		expect(chapterNotes.length).toEqual(0);
	});
});
