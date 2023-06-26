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

describe('chapters', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create chapters', async () => {
		const testBookTitle = 'My Book';
		const chapter1Title = 'Chapter 1';
		const chapter2Title = 'Chapter 2';

		const userResponse = await createUser(testSession);
		const userAuthoredBookResponse = await createBook(testBookTitle);

		let caller = router.createCaller({ session: null });
		const storylines = await caller.storylines.getAll({
			bookID: userAuthoredBookResponse.book.properties.id
		});

		caller = router.createCaller({ session: testSession });
		const chapter1Response = await caller.chapters.create({
			title: chapter1Title,
			description: 'My chapter 1',
			storylineID: storylines[0].storyline.properties.id,
			bookID: userAuthoredBookResponse.book.properties.id
		});

		const chapter2Response = await caller.chapters.create({
			title: chapter2Title,
			description: 'My chapter 2',
			storylineID: storylines[0].storyline.properties.id,
			bookID: userAuthoredBookResponse.book.properties.id,
			prevChapterID: chapter1Response.chapter.properties.id
		});

		const storylineChapters = await caller.chapters.getAll({
			storylineID: storylines[0].storyline.properties.id
		});

		expect(chapter1Response.chapter.properties.title).toEqual(chapter1Title);
		expect(chapter2Response.chapter.properties.title).toEqual(chapter2Title);
		expect(storylineChapters[0].chapter.properties.title).toEqual(chapter1Title);
	});

	test('update chapters', async () => {
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

		let chapterUpdateResponse = await caller.chapters.update({
			id: chapterCreateResponse.chapter.properties.id,
			description: 'Updated chapter 1'
		});

		console.log(chapterUpdateResponse);
		expect(chapterUpdateResponse.chapter.properties.description).toEqual('Updated chapter 1');
	});
});
