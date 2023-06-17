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

describe('books', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create book', async () => {
		const testBookTitle = 'My Book';
		const userResponse = await createUser(testSession);
		const userAuthoredBookResponse = await createBook(testBookTitle);

		const caller = router.createCaller({ session: null });
		const storylines = await caller.storylines.getAll({
			bookID: userAuthoredBookResponse.book.properties.id
		});

		expect(userAuthoredBookResponse.book.properties.title).toEqual(testBookTitle);
		expect(userAuthoredBookResponse.user.properties.id).toEqual(userResponse.user.properties.id);
		expect(storylines[0].storyline.properties.title).toEqual(testBookTitle);
	});

	test('get all books', async () => {
		await createUser(testSession);
		const testBookTitle1 = 'My Book 1';
		const testBookTitle2 = 'My Book 2';
		const testBookTitle3 = 'My Book 3';
		const userAuthoredBookResponse1 = await createBook(testBookTitle1);
		const userAuthoredBookResponse2 = await createBook(testBookTitle2);
		const userAuthoredBookResponse3 = await createBook(testBookTitle3);

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.getAll();

		expect(bookResponses.map((a) => a.book.properties.id).sort()).toEqual(
			[
				userAuthoredBookResponse1.book.properties.id,
				userAuthoredBookResponse2.book.properties.id,
				userAuthoredBookResponse3.book.properties.id
			].sort()
		);
	});

	test('get single book', async () => {
		await createUser(testSession);
		const testBookTitle1 = 'My Book 1';
		const testBookTitle2 = 'My Book 2';
		const userAuthoredBookResponse = await createBook(testBookTitle1);
		await createBook(testBookTitle2);

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.getByTitle({ searchTerm: testBookTitle1 });

		expect(bookResponses.length).toEqual(1);
		expect(bookResponses.pop()?.book).toEqual(userAuthoredBookResponse.book);
	});
});
