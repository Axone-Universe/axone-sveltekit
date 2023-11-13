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

describe('deltas', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('update deltas', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = await caller.storylines.get({
			bookID: bookResponse.data._id
		});

		// create chapter on default storyline
		const createChapterResponse = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines.data[0]
		);

		expect(createChapterResponse.data.description).toEqual('My chapter 1');

		const deltaCreateResponse = await caller.deltas.create({
			chapterID: createChapterResponse.data._id
		});

		const deltaUpdateResponse = await caller.deltas.update({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			ops: '[{"insert": "This is the story of the best of us"}]'
		});

		const ops = JSON.stringify(deltaUpdateResponse.data.versions![0].ops);
		expect(ops).toEqual('[{"insert":"This is the story of the best of us"}]');
	});

	test('version history', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

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

		const deltaCreateResponse = await caller.deltas.create({
			chapterID: createChapterResponse.data._id
		});

		let deltaUpdateResponse = await caller.deltas.update({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			ops: '[{"insert": "This is the story of the best of us"}]'
		});

		let ops = JSON.stringify(deltaUpdateResponse.data.versions![0].ops);
		expect(ops).toEqual('[{"insert":"This is the story of the best of us"}]');

		const versionCreateResponse = await caller.deltas.createVersion({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			title: 'Version 1'
		});

		expect(versionCreateResponse.data.versions?.length).toEqual(2);

		deltaUpdateResponse = await caller.deltas.update({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			ops: '[{"insert": "And it goes on"}]'
		});

		ops = JSON.stringify(deltaUpdateResponse.data.versions![1].ops);
		expect(ops).toEqual('[{"insert":"And it goes on"}]');
	});

	test('restore version', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

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

		const deltaCreateResponse = await caller.deltas.create({
			chapterID: createChapterResponse.data._id
		});

		let deltaUpdateResponse = await caller.deltas.update({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			ops: '[{"insert": "This is the story of the best of us"}]'
		});

		let ops = JSON.stringify(deltaUpdateResponse.data.versions![0].ops);
		expect(ops).toEqual('[{"insert":"This is the story of the best of us"}]');

		const versionCreateResponse = await caller.deltas.createVersion({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			title: 'Version 1'
		});

		expect(versionCreateResponse.data.versions?.length).toEqual(2);

		deltaUpdateResponse = await caller.deltas.update({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			ops: '[{"insert": "And it goes on"}]'
		});

		ops = JSON.stringify(deltaUpdateResponse.data.versions![1].ops);
		expect(ops).toEqual('[{"insert":"And it goes on"}]');

		const versionRestoreResponse = await caller.deltas.restoreVersion({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			versionID: deltaUpdateResponse.data.versions![0]._id
		});

		ops = JSON.stringify(versionRestoreResponse.data.ops);
		expect(ops).toEqual('[{"insert":"This is the story of the best of us"}]');
	});
});
