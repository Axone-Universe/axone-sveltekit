import { router } from '$lib/trpc/router';
import { cleanUpDatabase, createUser, testSession } from '$lib/util/testing';

const createBook = async (title: string) => {
	const caller = router.createCaller({ session: testSession });

	return await caller.books.create(title);
};

describe('books', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create book', async () => {
		const testBookTitle = 'My Book';
		const user = await createUser(testSession);
		const bookResponse = await createBook(testBookTitle);

		expect(bookResponse.book.title).toEqual(testBookTitle);
		expect(bookResponse.creator).toEqual(user);
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
		const books = await caller.books.list();

		expect(books.map((a) => a.id).sort()).toEqual(
			[bookResponse1.book.id, bookResponse2.book.id, bookResponse3.book.id].sort()
		);
	});

	test('get single book', async () => {
		await createUser(testSession);
		const testBookTitle1 = 'My Book 1';
		const testBookTitle2 = 'My Book 2';
		const bookResponse1 = await createBook(testBookTitle1);
		await createBook(testBookTitle2);

		const caller = router.createCaller({ session: null });
		const books = await caller.books.list(testBookTitle1);

		expect(books.length).toEqual(1);
		expect(books.pop()).toEqual(bookResponse1.book);
	});
});
