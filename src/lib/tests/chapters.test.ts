import type { UserProperties } from '$lib/properties/user';
import { router } from '$lib/trpc/router';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	testUserOne,
	testUserTwo,
	createBook,
	createChapter
} from '$lib/util/testing/testing';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('chapters', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create chapters', async () => {
		const testBookTitle = 'My Book';
		const chapter1Title = 'Chapter 1';
		const chapter2Title = 'Chapter 2';

		const testUserOneSession = createTestSession(testUserOne);
		const user = await createDBUser(testUserOneSession);

		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		const caller = router.createCaller({ session: testUserOneSession });
		let storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		const chapter1Response = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		const chapter2Response = await createChapter(
			testUserOneSession,
			chapter2Title,
			'My chapter 2',
			storylines[0],
			chapter1Response.data._id
		);

		storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		let storylineChapters = await caller.chapters.getByStoryline({
			storylineID: storylines[0]._id,
			storylineChapterIDs: storylines[0].chapters as string[]
		});

		const chapter1Delta = await caller.deltas.getById({
			id: chapter1Response.data.delta as string
		});
		const chapter2Delta = await caller.deltas.getById({
			id: chapter2Response.data.delta as string
		});

		const chapter1 = await caller.chapters.getById({ id: chapter1Response.data._id });

		expect(chapter1Response.data.title).toEqual(chapter1Title);
		expect(chapter2Response.data.title).toEqual(chapter2Title);
		expect(chapter1.data.children!.length).toEqual(1);

		expect(chapter1Delta.data.permissions).toEqual(chapter1Response.data.permissions);
		expect(chapter2Delta.data.permissions).toEqual(chapter2Response.data.permissions);
		expect(chapter1Delta.data.user).toEqual((chapter1Response.data.user as UserProperties)._id);
		expect(chapter2Delta.data.user).toEqual((chapter1Response.data.user as UserProperties)._id);
		expect(
			typeof chapter2Response.data.user === 'string'
				? chapter2Response.data.user
				: chapter2Response.data.user?._id
		).toEqual(user.data._id);
		expect(storylineChapters.data[0].title).toEqual(chapter1Title);

		// Get up to a certain point
		storylineChapters = await caller.chapters.getByStoryline({
			storylineID: storylines[0]._id,
			storylineChapterIDs: storylines[0].chapters as string[],
			toChapterID: chapter1Response.data._id
		});

		expect(storylineChapters.data.length).toEqual(1);
	});

	test('update chapters', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';

		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		const chapterCreateResponse = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		expect(chapterCreateResponse.data.description).toEqual('My chapter 1');

		const chapterUpdateResponse = await caller.chapters.update({
			id: chapterCreateResponse.data._id,
			description: 'Updated chapter 1'
		});

		expect(chapterUpdateResponse.data.description).toEqual('Updated chapter 1');
		expect(chapterUpdateResponse.data.updatedAt).greaterThan(chapterUpdateResponse.data.createdAt!);
	});

	test('delete chapters', async () => {
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(testUserOne);
		const testUserTwoSession = createTestSession(testUserTwo);

		await createDBUser(testUserOneSession);
		await createDBUser(testUserTwoSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		let caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		await createChapter(testUserOneSession, 'Chapter 1', 'My chapter 1', storylines[0]);

		const chapter2Response = await createChapter(
			testUserOneSession,
			'Chapter 2',
			'My chapter 2',
			storylines[0]
		);

		const chapter3Response = await createChapter(
			testUserOneSession,
			'Chapter 3',
			'My chapter 3',
			storylines[0]
		);

		const chapter4Response = await createChapter(
			testUserTwoSession,
			'Chapter 4',
			'My chapter 4',
			storylines[0]
		);

		const chapter5Response = await createChapter(
			testUserOneSession,
			'Chapter 5',
			'My chapter 5',
			storylines[0]
		);

		let storyline = (
			await caller.storylines.getById({
				id: storylines[0]._id
			})
		).data;

		let storylineChapters = (
			await caller.chapters.getByStoryline({
				storylineChapterIDs: storyline.chapters as string[],
				storylineID: storyline._id
			})
		).data;

		expect(storylineChapters.length).toEqual(5);
		expect(storylineChapters[0].children![0]).toEqual(chapter2Response.data._id);

		// Delete chapter 2
		caller = router.createCaller({ session: testUserOneSession });
		const chapter2DeleteResponse = await caller.chapters.delete({
			id: chapter2Response.data._id
		});

		storyline = (
			await caller.storylines.getById({
				id: storylines[0]._id
			})
		).data;

		expect(storyline.chapters!.length).toEqual(4);

		storylineChapters = (
			await caller.chapters.getByStoryline({
				storylineChapterIDs: storyline.chapters as string[],
				storylineID: storyline._id
			})
		).data;

		expect(storylineChapters.length).toEqual(4);
		expect(storylineChapters[0].children![0]).toEqual(chapter3Response.data._id);
		expect(chapter2DeleteResponse.data.deletedCount).toEqual(1);

		const deleteChapterResponse = await caller.chapters.delete({
			id: chapter3Response.data._id
		});

		expect(
			deleteChapterResponse.message.includes(
				'This chapter was referenced by another author, it can only be archived.'
			)
		).toEqual(true);

		const chapter5DeleteResponse = await caller.chapters.delete({
			id: chapter5Response.data._id
		});
		expect(chapter5DeleteResponse.data.deletedCount).toEqual(1);

		caller = router.createCaller({ session: testUserTwoSession });
		const chapter4DeleteResponse = await caller.chapters.delete({
			id: chapter4Response.data._id
		});

		expect(chapter4DeleteResponse.data.deletedCount).toEqual(1);
	});

	test('updating archived status', async () => {
		const session = createTestSession(testUserOne);
		await createDBUser(session);
		const book = await createBook(session);

		const caller = router.createCaller({ session });

		const storyline = (
			await caller.storylines.get({
				bookID: book.data._id
			})
		).data[0];

		const chapterOne = await createChapter(session, 'Chapter 1', 'My chapter 1', storyline);
		const chapterTwo = await createChapter(
			session,
			'Chapter 2',
			'My chapter 2',
			storyline,
			chapterOne.data._id
		);
		const chapterThree = await createChapter(
			session,
			'Chapter 3',
			'My chapter 3',
			storyline,
			chapterTwo.data._id
		);

		// Check archived before updating
		expect(chapterOne.data.archived).toEqual(false);
		expect(chapterTwo.data.archived).toEqual(false);
		expect(chapterThree.data.archived).toEqual(false);

		// Archive chapters one and two
		await caller.chapters.setArchived({
			ids: [chapterOne.data._id, chapterTwo.data._id],
			archived: true
		});

		// Check archived changed only for chapters one and two
		expect((await caller.chapters.getById({ id: chapterOne.data._id })).data.archived).toEqual(
			true
		);
		expect((await caller.chapters.getById({ id: chapterTwo.data._id })).data.archived).toEqual(
			true
		);
		expect((await caller.chapters.getById({ id: chapterThree.data._id })).data.archived).toEqual(
			false
		);

		// Check archived also archived the deltas
		const delta1Response = await caller.deltas.getById({
			id: chapterOne.data.delta as string
		});

		const delta2Response = await caller.deltas.getById({
			id: chapterTwo.data.delta as string
		});

		const delta3Response = await caller.deltas.getById({
			id: chapterThree.data.delta as string
		});

		expect(delta1Response.data.archived).toEqual(true);
		expect(delta2Response.data.archived).toEqual(true);
		expect(delta3Response.data.archived).toEqual(false);

		// Check archived chapters cannot be edited
		const chapterUpdateResponse = await caller.chapters.update({
			id: chapterOne.data._id,
			description: 'Updated chapter 1'
		});

		expect(chapterUpdateResponse.data.description).toEqual('My chapter 1');
	});

	test('chapter comments', async () => {
		const testBookTitle = 'My Book';
		const chapter1Title = 'Chapter 1';

		const testUserOneSession = createTestSession(testUserOne);
		const user = await createDBUser(testUserOneSession);

		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		const chapter1Response = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		// create chapter comment
		const comment1 = (
			await caller.chapters.createComment({
				comment: 'amazing storyline!',
				chapterId: chapter1Response.data._id ?? ''
			})
		).data;

		expect(comment1.comment).toEqual('amazing storyline!');

		// test delete comments
		await caller.chapters.deleteComment({
			commentId: comment1._id,
			chapterId: chapter1Response.data._id ?? ''
		});

		let chapterResponse = (
			await caller.chapters.getById({
				id: chapter1Response.data._id
			})
		).data;

		expect(chapterResponse.comments?.length).toEqual(0);
		expect(chapterResponse.commentsCount).toEqual(0);

		// test comments limit
		for (let i = 1; i < 21; i++) {
			await caller.chapters.createComment({
				comment: 'comment ' + i,
				chapterId: chapter1Response.data._id ?? ''
			});
		}

		chapterResponse = (
			await caller.chapters.getById({
				id: chapter1Response.data._id
			})
		).data;

		expect(chapterResponse.comments?.length).toEqual(10);
		expect(chapterResponse.commentsCount).toEqual(20);

		// test get comments
		const comments = (
			await caller.chapters.getComments({
				id: chapter1Response.data._id,
				limit: 5,
				skip: 5
			})
		).data;

		expect(comments?.length).toEqual(5);
		expect(comments![0].comment).toEqual('comment 15');
	});
});
