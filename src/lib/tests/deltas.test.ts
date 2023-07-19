import { router } from '$lib/trpc/router';
import { GenresBuilder } from '$lib/util/genres';
import {
	cleanUpDatabase,
	connectTestDatabase,
	createUser,
	testSession
} from '$lib/util/testing/testing';

const createBook = async (title: string) => {
	const caller = router.createCaller({ session: testSession });

	const genres = new GenresBuilder();
	genres.genre('Action');

	return await caller.books.create({
		title,
		imageURL: 'www.example.com',
		genres: genres.getGenres(),
		description: ''
	});
};

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

		await createUser(testSession);
		const bookResponse = await createBook(testBookTitle);

		// get the default storyline from created book
		let caller = router.createCaller({ session: null });
		const storylines = await caller.storylines.getAll({
			bookID: bookResponse._id
		});

		// create chapter on default storyline
		caller = router.createCaller({ session: testSession });
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
