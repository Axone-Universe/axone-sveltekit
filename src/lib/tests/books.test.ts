import { router } from '$lib/trpc/router';
import {
	connectDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	createBook,
	generateUserSessionData,
	createChapter
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectDatabase();
});

describe('books', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	const testUserOne = generateUserSessionData();
	const testUserTwo = generateUserSessionData();
	const testUserThree = generateUserSessionData();

	test('create and update a book', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		let bookResponse = await createBook(testUserOneSession, testBookTitle);

		const caller = router.createCaller({ session: testUserOneSession });
		await caller.storylines.get({
			bookID: bookResponse.data._id
		});

		expect(bookResponse.data.title).toEqual(testBookTitle);
		expect(bookResponse.data.storylines?.length).toEqual(1);
		expect(bookResponse.data.createdAt).greaterThan(new Date(Date.now() - 1_000));

		bookResponse = await caller.books.update({
			id: bookResponse.data._id,
			title: 'My Book Update'
		});
		expect(bookResponse.data.title).toEqual('My Book Update');
		expect(bookResponse.data.updatedAt).greaterThan(bookResponse.data.createdAt!);
	});

	test('get all books', async () => {
		await createDBUser(createTestSession(testUserOne));
		await createDBUser(createTestSession(testUserTwo));
		await createDBUser(createTestSession(testUserThree));

		const bookResponse1 = await createBook(createTestSession(testUserOne));
		const bookResponse2 = await createBook(createTestSession(testUserTwo));
		const bookResponse3 = await createBook(createTestSession(testUserThree));

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.get({});

		expect(bookResponses.data.map((a) => a._id).sort()).toEqual(
			[bookResponse1.data._id, bookResponse2.data._id, bookResponse3.data._id].sort()
		);
	});

	test('get all books with limit and cursor', async () => {
		await createDBUser(createTestSession(testUserOne));
		await createDBUser(createTestSession(testUserTwo));
		await createDBUser(createTestSession(testUserThree));

		const bookResponse1 = await createBook(createTestSession(testUserOne));
		const bookResponse2 = await createBook(createTestSession(testUserTwo));
		const bookResponse3 = await createBook(createTestSession(testUserThree));

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.get({ limit: 2 });
		const bookResponses2 = await caller.books.get({ limit: 2, cursor: bookResponses.cursor });

		expect([...bookResponses.data, ...bookResponses2.data].map((a) => a._id).sort()).toEqual(
			[bookResponse1.data._id, bookResponse2.data._id, bookResponse3.data._id].sort()
		);
	});

	test('get books by genres', async () => {
		await createDBUser(createTestSession(testUserOne));
		await createDBUser(createTestSession(testUserTwo));
		await createDBUser(createTestSession(testUserThree));

		const bookResponse1 = await createBook(createTestSession(testUserOne), '', [
			'Action',
			'Adventure'
		]);
		const bookResponse2 = await createBook(createTestSession(testUserTwo), '', [
			'Action',
			'Adventure',
			'Fantasy'
		]);
		await createBook(createTestSession(testUserThree), '', ['Action', 'Dystopian']);

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.get({ genres: ['Action', 'Adventure'] });

		expect(bookResponses.data.map((a) => a._id).sort()).toEqual(
			[bookResponse1.data._id, bookResponse2.data._id].sort()
		);
	});

	test('get recommended books', async () => {
		const session = createTestSession(testUserOne);
		const user = await createDBUser(session, ['Fantasy', 'Horror']);

		const bookResponse1 = await createBook(createTestSession(testUserTwo), '', [
			'Action',
			'Fantasy'
		]);
		const bookResponse2 = await createBook(createTestSession(testUserTwo), '', ['Horror']);
		const bookResponse3 = await createBook(createTestSession(testUserTwo), '', [
			'Fantasy',
			'Horror'
		]);
		await createBook(createTestSession(testUserTwo), '', ['Autobiographies', 'Historical']);

		const caller = router.createCaller({ session });
		const bookResponses = await caller.books.get({ tags: ['Recommended'] });

		expect(bookResponses.data.map((a) => a._id).sort()).toEqual(
			[bookResponse1.data._id, bookResponse2.data._id, bookResponse3.data._id].sort()
		);
	});

	test('get book by title', async () => {
		await createDBUser(createTestSession(testUserOne));
		const testBookTitle1 = 'My Book 1';
		const testBookTitle2 = 'My Book 2';
		const bookResponse = await createBook(createTestSession(testUserOne), testBookTitle1);
		await createBook(createTestSession(testUserOne), testBookTitle2);

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.get({ title: testBookTitle1 });

		expect(bookResponses.data.length).toEqual(2);
		expect(bookResponses.data[0]?._id).toEqual(bookResponse.data._id);
	});

	test('delete books', async () => {
		await createDBUser(createTestSession(testUserOne));
		const testBookTitle1 = 'My Book 1';
		const createBookResponse = await createBook(createTestSession(testUserOne), testBookTitle1);

		const caller = router.createCaller({ session: createTestSession(testUserOne) });
		let deletBookResponse = await caller.books.delete({ id: createBookResponse.data._id });

		expect(deletBookResponse.success).toEqual(false);
		expect(deletBookResponse.message).toContain(
			'Please delete all storylines before deleting the book'
		);

		// delete the storyline
		const storylineResponse = await caller.storylines.getByBookID({
			bookID: createBookResponse.data._id
		});

		const deletStorylineResponse = await caller.storylines.delete({
			id: storylineResponse.data[0]._id
		});

		expect(deletStorylineResponse.success).toEqual(true);

		// delete the book again
		deletBookResponse = await caller.books.delete({ id: createBookResponse.data._id });

		expect(deletBookResponse.success).toEqual(true);
		expect(deletBookResponse.message).toContain('book successfully deleted');
	});

	test('updating archived status', async () => {
		const sessionOne = createTestSession(testUserOne);
		const sessionTwo = createTestSession(testUserTwo);
		await createDBUser(sessionOne);
		await createDBUser(sessionTwo);
		const userOneBook1 = await createBook(sessionOne);
		const userOneBook2 = await createBook(sessionOne);
		const userTwoBook1 = await createBook(sessionTwo);

		const callerOne = router.createCaller({ session: sessionOne });
		const callerTwo = router.createCaller({ session: sessionTwo });

		const userOneMainStoryline = (
			await callerOne.storylines.get({
				bookID: userOneBook1.data._id
			})
		).data[0];

		const userTwoMainStoryline = (
			await callerTwo.storylines.get({
				bookID: userTwoBook1.data._id
			})
		).data[0];

		const userOneChapter = await createChapter(
			sessionOne,
			"UserOne's Chapter 1",
			'Chapter 1',
			userOneMainStoryline
		);

		const userTwoStoryline = (
			await callerTwo.storylines.create({
				title: 'Storyline 2',
				description: 'Storyline 2',
				book: userOneBook1.data._id,
				parent: userOneMainStoryline._id,
				parentChapter: userOneChapter.data._id
			})
		).data;

		const userTwoChapter = await createChapter(
			sessionTwo,
			"UserTwo's Chapter 1",
			'The Spin-off Chapter 1',
			userTwoStoryline
		);

		// Check archived before updating
		expect(userOneBook1.data.archived).toEqual(false);
		expect(userOneBook2.data.archived).toEqual(false);
		expect(userOneMainStoryline.archived).toEqual(false);
		expect(userTwoMainStoryline.archived).toEqual(false);
		expect(userTwoStoryline.archived).toEqual(false);
		expect(userOneChapter.data.archived).toEqual(false);
		expect(userTwoChapter.data.archived).toEqual(false);

		// Archive user one's books
		await callerOne.books.setArchived({
			ids: [userOneBook1.data._id, userOneBook2.data._id],
			archived: true
		});

		// Check archived changed only for user one's books
		expect((await callerOne.books.getById({ id: userOneBook1.data._id })).data.archived).toEqual(
			true
		);
		expect((await callerOne.books.getById({ id: userOneBook2.data._id })).data.archived).toEqual(
			true
		);
		expect((await callerOne.books.getById({ id: userTwoBook1.data._id })).data.archived).toEqual(
			false
		);

		// Check archived changed only for user one's storylines
		expect(
			(await callerOne.storylines.getById({ id: userOneMainStoryline._id })).data.archived
		).toEqual(true);
		expect(
			(await callerTwo.storylines.getById({ id: userTwoMainStoryline._id })).data.archived
		).toEqual(false);
		expect(
			(await callerTwo.storylines.getById({ id: userTwoStoryline._id })).data.archived
		).toEqual(false);

		// Check archived changed only for user one's chapters
		expect(
			(await callerOne.chapters.getById({ id: userOneChapter.data._id })).data.archived
		).toEqual(true);
		expect(
			(await callerTwo.chapters.getById({ id: userTwoChapter.data._id })).data.archived
		).toEqual(false);
	});
});
