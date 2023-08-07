import { GenresBuilder } from '$lib/shared/genres';
import { router } from '$lib/trpc/router';
import {
	cleanUpDatabase,
	connectTestDatabase,
	createDBUser,
	createBook,
	createTestSession,
	testUserOne
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

		const deltaCreateResponse = await caller.deltas.create({
			chapterID: chapterCreateResponse._id
		});

		const deltaUpdateResponse = await caller.deltas.update({
			id: deltaCreateResponse._id,
			chapterID: chapterCreateResponse._id,
			ops: '[{"insert": "This is the story of the best of us"}]'
		});

		const ops = JSON.stringify(deltaUpdateResponse.ops);
		expect(ops).toEqual('[{"insert":"This is the story of the best of us"}]');
	});
});
