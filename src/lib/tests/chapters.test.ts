import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	testUserOne,
	createBook
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

		const user = await createDBUser(createTestSession(testUserOne));
		const bookResponse = await createBook(createTestSession(testUserOne), testBookTitle);

		let caller = router.createCaller({ session: null });
		const storylines = await caller.storylines.getAll({
			bookID: bookResponse._id
		});

		caller = router.createCaller({ session: createTestSession(testUserOne) });
		const chapter1Response = await caller.chapters.create({
			title: chapter1Title,
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id
		});

		const chapter2Response = await caller.chapters.create({
			title: chapter2Title,
			description: 'My chapter 2',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id,
			prevChapterID: chapter1Response._id
		});

		let storylineChapters = await caller.chapters.getAll({
			storylineID: storylines[0]._id
		});

		expect(chapter1Response.title).toEqual(chapter1Title);
		expect(chapter2Response.title).toEqual(chapter2Title);
		expect(chapter2Response.user).toEqual(user._id);
		expect(storylineChapters[0].title).toEqual(chapter1Title);

		// Get up to a certain point
		storylineChapters = await caller.chapters.getAll({
			storylineID: storylines[0].id,
			toChapterID: chapter1Response._id
		});

		expect(storylineChapters.length).toEqual(1);
	});

	test('update chapters', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';

		await createDBUser(createTestSession(testUserOne));
		const bookResponse = await createBook(createTestSession(testUserOne), testBookTitle);

		// get the default storyline from created book
		let caller = router.createCaller({ session: null });
		const storylines = await caller.storylines.getAll({
			bookID: bookResponse._id
		});

		// create chapter on default storyline
		caller = router.createCaller({ session: createTestSession(testUserOne) });
		const chapterCreateResponse = await caller.chapters.create({
			title: chapter1Title,
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id
		});

		expect(chapterCreateResponse.description).toEqual('My chapter 1');

		const chapterUpdateResponse = await caller.chapters.update({
			id: chapterCreateResponse._id,
			description: 'Updated chapter 1'
		});

		console.log(chapterUpdateResponse);
		expect(chapterUpdateResponse.description).toEqual('Updated chapter 1');
	});

	test('delete chapters', async () => {
		const testBookTitle = 'My Book';
		const chapter1Title = 'Chapter 1';
		const chapter2Title = 'Chapter 2';
		const chapter3Title = 'Chapter 3';

		await createDBUser(createTestSession(testUserOne));
		const bookResponse = await createBook(createTestSession(testUserOne), testBookTitle);

		let caller = router.createCaller({ session: null });
		const storylines = await caller.storylines.getAll({
			bookID: bookResponse._id
		});

		caller = router.createCaller({ session: createTestSession(testUserOne) });
		const chapter1Response = await caller.chapters.create({
			title: chapter1Title,
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id
		});

		const chapter2Response = await caller.chapters.create({
			title: chapter2Title,
			description: 'My chapter 2',
			storylineID: storylines[0].id,
			bookID: bookResponse.id,
			prevChapterID: chapter1Response._id
		});

		const chapter3Response = await caller.chapters.create({
			title: chapter3Title,
			description: 'My chapter 3',
			storylineID: storylines[0].id,
			bookID: bookResponse.id,
			prevChapterID: chapter2Response._id
		});

		const chapter2DeleteResponse = await caller.chapters.delete({
			id: chapter2Response._id
		});

		let storylineChapters = await caller.chapters.getAll({
			storylineID: storylines[0].id
		});

		expect(storylineChapters.length).toEqual(2);
		expect(chapter2DeleteResponse.deletedCount).toEqual(1);

		const chapter3DeleteResponse = await caller.chapters.delete({
			id: chapter3Response._id
		});

		storylineChapters = await caller.chapters.getAll({
			storylineID: storylines[0].id
		});

		expect(storylineChapters.length).toEqual(1);
		expect(chapter3DeleteResponse.deletedCount).toEqual(1);
	});
});
