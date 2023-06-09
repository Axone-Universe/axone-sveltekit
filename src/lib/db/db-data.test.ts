import { beforeAll } from 'vitest';

import { router } from '$lib/trpc/router';
import { GenresBuilder } from '$lib/util/genres';
import { cleanUpDatabase, createUser, testSession, testUser } from '$lib/util/testing/testing';

import type { Session } from '@supabase/supabase-js';

beforeAll(async () => {
	await cleanUpDatabase();
});

const createBook = async (title: string, testSession: Session) => {
	const caller = router.createCaller({ session: testSession });

	const genres = new GenresBuilder();
	genres.genre('Action');
	genres.genre('Adventure');
	genres.genre('Science Fiction');

	return await caller.books.create({
		title: title,
		description:
			'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of light, it was the season of darkness, it was the spring of hope, it was the winter of despair.',
		genres: genres.getGenres(),
		imageURL:
			'https://cdn.discordapp.com/attachments/1008571211179118703/1112713149867626496/taku_futuristic_4k_high_definition_image_of_african_financial_i_13f539da-a1d5-4b40-879c-c9d11443086e.png'
	});
};

describe('db test data', () => {
	const testUser1 = { ...testUser };
	testUser1.id = '1';
	const testSession1 = { ...testSession };
	testSession1.user = testUser1;

	const testUser2 = { ...testUser };
	testUser2.id = '2';
	const testSession2 = { ...testSession };
	testSession2.user = testUser2;

	const testUser3 = { ...testUser };
	testUser2.id = '3';
	const testSession3 = { ...testSession };
	testSession3.user = testUser3;

	test('create users', async () => {
		const userResponse1 = await createUser(testSession1);
		const userResponse2 = await createUser(testSession2);

		const caller = router.createCaller({ session: null });
		const userResponses = await caller.users.list();

		// compare sorted arrays to ignore element position differences (if any)
		expect(userResponses.map((a) => a.user.properties.id).sort()).toEqual(
			[userResponse1.user.properties.id, userResponse2.user.properties.id].sort()
		);
	});

	test('create books', async () => {
		await createUser(testSession);
		const testBookTitle1 = 'My Book 1';
		const testBookTitle2 = 'My Book 2';
		const testBookTitle3 = 'My Book 3';
		const userAuthoredBookResponse1 = await createBook(testBookTitle1, testSession1);
		const userAuthoredBookResponse2 = await createBook(testBookTitle2, testSession2);
		const userAuthoredBookResponse3 = await createBook(testBookTitle3, testSession3);

		const caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.list();

		expect(bookResponses.map((a) => a.book.properties.id).sort()).toEqual(
			[
				userAuthoredBookResponse1.book.properties.id,
				userAuthoredBookResponse2.book.properties.id,
				userAuthoredBookResponse3.book.properties.id
			].sort()
		);
	});
});
