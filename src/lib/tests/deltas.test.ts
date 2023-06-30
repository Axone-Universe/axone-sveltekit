import { router } from '$lib/trpc/router';
import { GenresBuilder } from '$lib/util/genres';
import { cleanUpDatabase, createUser, testSession } from '$lib/util/testing/testing';

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

describe('deltas', () => {
	test('update deltas', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';

		const userResponse = await createUser(testSession);
		const userAuthoredBookResponse = await createBook(testBookTitle);

		// get the default storyline from created book
		let caller = router.createCaller({ session: null });
		const storylines = await caller.storylines.getAll({
			bookID: userAuthoredBookResponse.book.properties.id
		});

		// create chapter on default storyline
		caller = router.createCaller({ session: testSession });
		let chapterCreateResponse = await caller.chapters.create({
			title: chapter1Title,
			description: 'My chapter 1',
			storylineID: storylines[0].storyline.properties.id,
			bookID: userAuthoredBookResponse.book.properties.id
		});

		expect(chapterCreateResponse.chapter.properties.description).toEqual('My chapter 1');

		let deltaCreateResponse = await caller.deltas.create({
			chapterID: chapterCreateResponse.chapter.properties.id
		});

		let deltaUpdateResponse = await caller.deltas.update({
			id: deltaCreateResponse.delta.properties.id,
			chapterID: chapterCreateResponse.chapter.properties.id,
			ops: '[{"insert": "This is the story of the best of us"}]'
		});

		expect(deltaUpdateResponse.delta.properties.ops).toEqual(
			'[{"insert":"This is the story of the best of us"}]'
		);
	});
});
