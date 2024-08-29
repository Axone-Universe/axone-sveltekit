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

		const deltaResponse = await caller.deltas.getById({
			id: deltaUpdateResponse.data.delta as string
		});
		const ops = JSON.stringify(deltaResponse.data.ops);
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

		let deltaResponse = await caller.deltas.getById({
			id: deltaUpdateResponse.data.delta as string
		});
		let ops = JSON.stringify(deltaResponse.data.ops);
		expect(ops).toEqual('[{"insert":"This is the story of the best of us"}]');

		const versionCreateResponse = await caller.deltas.createVersion({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			title: 'Version 1'
		});

		expect(versionCreateResponse.data.title).toEqual('Version 1');

		deltaUpdateResponse = await caller.deltas.update({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			ops: '[{"insert": "And it goes on"}]'
		});

		deltaResponse = await caller.deltas.getById({
			id: deltaUpdateResponse.data.delta as string
		});
		ops = JSON.stringify(deltaResponse.data.versions![1].ops);
		expect(ops).toEqual('[{"insert":"And it goes on"}]');

		let paragraph = `The average number of letters in a paragraph of a novel can vary widely depending on factors such as the 
			writing style, the genre of the novel, and the specific content of the paragraph. However, as a rough estimate, 
			a paragraph in a novel might typically contain around 100 to 200 words. If we assume an average word length of 5 letters, 
			which is a common approximation, then a paragraph might have around 500 to 1,000 letters. 
			Keep in mind that this is a generalization, and actual values can deviate significantly based on the factors mentioned earlier. 
			Additionally, novels can vary in style and structure, so the length of paragraphs can differ from one book to another`;

		paragraph = paragraph.replace(/[^a-zA-Z ]/g, '');

		// create a version when the delta is long enough
		deltaUpdateResponse = await caller.deltas.update({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			ops: `[{"insert": "${paragraph}"}]`
		});

		deltaResponse = await caller.deltas.getById({
			id: deltaUpdateResponse.data.delta as string
		});
		expect(deltaResponse.data.versions![2].ops).toEqual([]);
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

		let deltaResponse = await caller.deltas.getById({
			id: deltaUpdateResponse.data.delta as string
		});
		let ops = JSON.stringify(deltaResponse.data.ops);
		expect(ops).toEqual('[{"insert":"This is the story of the best of us"}]');

		const versionCreateResponse = await caller.deltas.createVersion({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			title: 'Version 1'
		});

		expect(versionCreateResponse.data.title).toEqual('Version 1');

		deltaUpdateResponse = await caller.deltas.update({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			ops: '[{"insert": "And it goes on"}]'
		});

		deltaResponse = await caller.deltas.getById({
			id: deltaUpdateResponse.data.delta as string
		});

		ops = JSON.stringify(deltaResponse.data.versions![1].ops);
		expect(ops).toEqual('[{"insert":"And it goes on"}]');

		// get delta
		deltaResponse = await caller.deltas.getById({ id: deltaCreateResponse.data._id });

		const versionRestoreResponse = await caller.deltas.restoreVersion({
			id: deltaCreateResponse.data._id,
			chapterID: createChapterResponse.data._id,
			versionID: deltaResponse.data.versions![0]._id
		});

		ops = JSON.stringify(versionRestoreResponse.data.ops);
		expect(ops).toEqual('[{"insert":"This is the story of the best of us"}]');
	});
});
