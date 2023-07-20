import { router } from '$lib/trpc/router';
import { GenresBuilder } from '$lib/shared/genres';
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

describe('storylines', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create storylines', async () => {
		const testBookTitle = 'My Book';
		const chapter1Title = 'Chapter 1';
		const chapter2_1Title = 'Chapter 2_1';
		const chapter3_1Title = 'Chapter 3_1';
		const chapter2_2Title = 'Chapter 2_2';

		await createUser(testSession);
		const bookResponse = await createBook(testBookTitle);

		let caller = router.createCaller({ session: null });
		const storylines = await caller.storylines.getAll({
			bookID: bookResponse._id
		});

		caller = router.createCaller({ session: testSession });
		const chapter1Response = await caller.chapters.create({
			title: chapter1Title,
			description: 'My chapter 1',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id
		});

		const chapter2_1Response = await caller.chapters.create({
			title: chapter2_1Title,
			description: 'My chapter 2',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id,
			prevChapterID: chapter1Response._id
		});

		const chapter3_1Response = await caller.chapters.create({
			title: chapter3_1Title,
			description: 'My chapter 3',
			storylineID: storylines[0]._id,
			bookID: bookResponse._id,
			prevChapterID: chapter2_1Response._id
		});

		const storyline_1Chapters = await caller.chapters.getAll({
			storylineID: storylines[0]._id
		});

		// Create a new storyline
		const storyline2 = await caller.storylines.create({
			title: 'Storyline 2',
			description: 'Storyline 2',
			book: bookResponse._id,
			parent: storylines[0]._id,
			parentChapter: chapter1Response._id
		});

		const chapter2_2Response = await caller.chapters.create({
			title: chapter2_2Title,
			description: 'My chapter 2',
			storylineID: storyline2._id,
			bookID: bookResponse._id,
			prevChapterID: chapter1Response._id
		});

		const storyline_2Chapters = await caller.chapters.getAll({
			storylineID: storyline2._id
		});

		expect(chapter1Response.title).toEqual(chapter1Title);
		expect(chapter2_1Response.title).toEqual(chapter2_1Title);

		expect(storyline_1Chapters[0].title).toEqual(chapter1Title);
		expect(storyline_1Chapters[1].title).toEqual(chapter2_1Title);

		// storyline 2 should have 2 chapters with the last being the branched off chapter
		expect(storyline_2Chapters[0].title).toEqual(chapter1Title);
		expect(storyline_2Chapters[1].title).toEqual(chapter2_2Title);
	});
});
