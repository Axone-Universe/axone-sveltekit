import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	createBook,
	generateTestUser,
	createChapter
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('books', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	const testUserOne = generateTestUser();
	const testUserTwo = generateTestUser();
	const testUserThree = generateTestUser();

	test('create a book', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		const caller = router.createCaller({ session: testUserOneSession });
		await caller.storylines.get({
			bookID: bookResponse._id
		});

		expect(bookResponse.title).toEqual(testBookTitle);
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

		expect(bookResponses.result.map((a) => a._id).sort()).toEqual(
			[bookResponse1._id, bookResponse2._id, bookResponse3._id].sort()
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

		expect([...bookResponses.result, ...bookResponses2.result].map((a) => a._id).sort()).toEqual(
			[bookResponse1._id, bookResponse2._id, bookResponse3._id].sort()
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

		expect(bookResponses.result.map((a) => a._id).sort()).toEqual(
			[bookResponse1._id, bookResponse2._id].sort()
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
		const bookResponses = await caller.books.get({});

		expect(bookResponses.result.map((a) => a._id).sort()).toEqual(
			[bookResponse1._id, bookResponse2._id, bookResponse3._id].sort()
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

		expect(bookResponses.result.length).toEqual(2);
		expect(bookResponses.result[0]?._id).toEqual(bookResponse._id);
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
				bookID: userOneBook1._id
			})
		).result[0];

		const userTwoMainStoryline = (
			await callerTwo.storylines.get({
				bookID: userTwoBook1._id
			})
		).result[0];

		const userOneChapter = await createChapter(
			sessionOne,
			"UserOne's Chapter 1",
			'Chapter 1',
			userOneMainStoryline
		);

		const userTwoStoryline = await callerTwo.storylines.create({
			title: 'Storyline 2',
			description: 'Storyline 2',
			book: userOneBook1._id,
			parent: userOneMainStoryline._id,
			parentChapter: userOneChapter._id
		});

		const userTwoChapter = await createChapter(
			sessionTwo,
			"UserTwo's Chapter 1",
			'The Spin-off Chapter 1',
			userTwoStoryline
		);

		// Check archived before updating
		expect(userOneBook1.archived).toEqual(false);
		expect(userOneBook2.archived).toEqual(false);
		expect(userOneMainStoryline.archived).toEqual(false);
		expect(userTwoMainStoryline.archived).toEqual(false);
		expect(userTwoStoryline.archived).toEqual(false);
		expect(userOneChapter.archived).toEqual(false);
		expect(userTwoChapter.archived).toEqual(false);

		// Archive user one's books
		await callerOne.books.setArchived({
			ids: [userOneBook1._id, userOneBook2._id],
			archived: true
		});

		// Check archived changed only for user one's books
		expect((await callerOne.books.getById({ id: userOneBook1._id })).archived).toEqual(true);
		expect((await callerOne.books.getById({ id: userOneBook2._id })).archived).toEqual(true);
		expect((await callerOne.books.getById({ id: userTwoBook1._id })).archived).toEqual(false);

		// Check archived changed only for user one's storylines
		expect(
			(await callerOne.storylines.getById({ storylineID: userOneMainStoryline._id })).archived
		).toEqual(true);
		expect(
			(await callerTwo.storylines.getById({ storylineID: userTwoMainStoryline._id })).archived
		).toEqual(false);
		expect(
			(await callerTwo.storylines.getById({ storylineID: userTwoStoryline._id })).archived
		).toEqual(false);

		// Check archived changed only for user one's chapters
		expect((await callerOne.chapters.getById({ id: userOneChapter._id })).archived).toEqual(true);
		expect((await callerTwo.chapters.getById({ id: userTwoChapter._id })).archived).toEqual(false);
	});
});
