import { router } from '$lib/trpc/router';
import { GenresBuilder } from '$lib/util/genres';
import type { HydratedDocument } from 'mongoose';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createUser,
	testSession
} from '$lib/util/testing/testing';
import type { UserProperties } from '$lib/shared/user';

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

describe('books', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create book', async () => {
		const testBookTitle = 'My Book';
		const userResponse = await createUser(testSession);
		const bookResponse = await createBook(testBookTitle);

		const caller = router.createCaller({ session: null });
		const storylines = await caller.storylines.getAll({
			bookID: bookResponse._id
		});

		expect(bookResponse.title).toEqual(testBookTitle);
		expect((bookResponse.user as unknown as HydratedDocument<UserProperties>)!._id).toEqual(
			userResponse._id
		);
		expect(storylines[0].title).toEqual(testBookTitle);
	});

	test('get all books', async () => {
		await createUser(testSession);
		const testBookTitle1 = 'My Book 1';
		const testBookTitle2 = 'My Book 2';
		const testBookTitle3 = 'My Book 3';
		const bookResponse1 = await createBook(testBookTitle1);
		const bookResponse2 = await createBook(testBookTitle2);
		const bookResponse3 = await createBook(testBookTitle3);

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.getAll();

		expect(bookResponses.map((a) => a._id).sort()).toEqual(
			[bookResponse1._id, bookResponse2._id, bookResponse3._id].sort()
		);
	});

	test('get single book', async () => {
		await createUser(testSession);
		const testBookTitle1 = 'My Book 1';
		const testBookTitle2 = 'My Book 2';
		const bookResponse = await createBook(testBookTitle1);
		await createBook(testBookTitle2);

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.getByTitle({ searchTerm: testBookTitle1 });

		expect(bookResponses.length).toEqual(1);
		expect(bookResponses.pop()?._id).toEqual(bookResponse._id);
	});
});
