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

describe('resources', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('update resources', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(generateUserSessionData());

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// create chapter on default storyline
		const createChapterResponse = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		expect(createChapterResponse.data.description).toEqual('My chapter 1');

		// create resource
		const resourceCreateResponse = await caller.resources.create({
			chapterID: createChapterResponse.data._id,
			type: 'image'
		});

		expect(resourceCreateResponse.data.type).toEqual('image');
		expect(resourceCreateResponse.data.chapter).toEqual(createChapterResponse.data._id);

		const resourceUpdateResponse = await caller.resources.update({
			id: resourceCreateResponse.data._id,
			title: 'Reya dancing',
			description: 'Reya dancing after the snow had fallen'
		});

		expect(resourceUpdateResponse.data.title).toEqual('Reya dancing');
	});

	test('delete resources', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(generateUserSessionData());

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// create chapter on default storyline
		const createChapterResponse = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		expect(createChapterResponse.data.description).toEqual('My chapter 1');

		// create the resource
		const resourceCreateResponse = await caller.resources.create({
			chapterID: createChapterResponse.data._id,
			type: 'image'
		});

		await caller.resources.delete({
			id: resourceCreateResponse.data._id
		});

		const chapterNesources = await caller.resources.getByChapterID({
			chapterID: createChapterResponse.data._id
		});

		expect(chapterNesources.data.length).toEqual(0);
	});
});
