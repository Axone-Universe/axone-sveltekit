import { beforeAll } from 'vitest';

import { router } from '$lib/trpc/router';
import { GenresBuilder } from '$lib/shared/genres';
import {
	cleanUpDatabase,
	connectDatabase,
	createUser,
	testSession,
	testUser
} from '$lib/util/testing/testing';

import type { Session } from '@supabase/supabase-js';

beforeAll(async () => {
	await connectDatabase();
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
		expect(userResponses.map((a) => a._id).sort()).toEqual(
			[userResponse1._id, userResponse2._id].sort()
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

		let caller = router.createCaller({ session: null });
		const bookResponses = await caller.books.getAll();

		// Create chapters
		const chapter1Title = 'The Quantum Nexus';
		const chapter2_1Title = 'Echoes from Epsilon Prime';
		const chapter3_1Title = 'The Dark Nexus Unleashed';
		const chapter2_2Title = 'Echoes from Megadrones';

		const storylines = await caller.storylines.getAll({
			bookID: userAuthoredBookResponse1._id
		});

		caller = router.createCaller({ session: testSession1 });
		const chapter1Response = await caller.chapters.create({
			title: chapter1Title,
			description: `In a not-too-distant future, Dr. Samantha Walker, a brilliant physicist, 
				discovers a groundbreaking breakthrough in quantum technology. 
				With the ability to harness the power of the quantum realm, 
				she unveils a new method of transportation that promises to revolutionize interstellar travel. 
				As Samantha's invention catches the attention of powerful factions and sparks a race for control, 
				she finds herself at the center of a perilous adventure where the boundaries of reality blur and the 
				fate of the universe hangs in the balance.`,
			storylineID: storylines[0]._id,
			bookID: userAuthoredBookResponse1._id
		});

		caller = router.createCaller({ session: testSession2 });
		const chapter2_1Response = await caller.chapters.create({
			title: chapter2_1Title,
			description: `While testing the limits of her quantum device, Samantha accidentally picks up a mysterious distress signal 
				from the distant planet of Epsilon Prime. Curiosity piqued, she assembles a team of experts and embarks on a 
				perilous journey to investigate the signal's origin. What they discover on Epsilon Prime is beyond their wildest 
				imaginations—an ancient civilization on the brink of extinction, struggling to preserve their knowledge and 
				existence. Samantha and her team must unravel the secrets of the planet and confront the enigmatic forces at 
				play if they hope to survive and bring hope to a dying world.`,
			storylineID: storylines[0].id,
			bookID: userAuthoredBookResponse1._id,
			prevChapterID: chapter1Response._id
		});

		const chapter3_1Response = await caller.chapters.create({
			title: chapter3_1Title,
			description: `Back on Earth, Samantha's quantum technology becomes the subject of a global power struggle. The nefarious 
				organization known as the Dark Nexus, led by the enigmatic and ruthless Dr. Victor Thorn, seeks to harness the 
				quantum device's power for their own sinister agenda. As they unleash chaos and destruction, Samantha and her 
				team must gather their wits and allies to stop the Dark Nexus before it's too late. In a battle that spans 
				across dimensions, Samantha realizes the true extent of her invention's capabilities and the responsibility 
				she holds in shaping the destiny of humanity.`,
			storylineID: storylines[0].id,
			bookID: userAuthoredBookResponse1._id,
			prevChapterID: chapter2_1Response._id
		});

		// Create a new storyline
		const storyline2 = await caller.storylines.create({
			title: 'Storyline 1',
			description: 'Storyline 1',
			book: userAuthoredBookResponse1._id,
			parent: storylines[0]._id,
			parentChapter: chapter1Response._id
		});

		const chapter2_2Response = await caller.chapters.create({
			title: chapter2_2Title,
			description: `While testing the limits of her quantum device, Samantha accidentally picks up a mysterious distress signal 
			from the distant planet of Megadrones. Curiosity piqued, she assembles a team of experts and embarks on a 
			perilous journey to investigate the signal's origin. What they discover on Epsilon Prime is beyond their wildest 
			imaginations—an ancient civilization on the brink of extinction, struggling to preserve their knowledge and 
			existence. Samantha and her team must unravel the secrets of the planet and confront the enigmatic forces at 
			play if they hope to survive and bring hope to a dying world.`,
			storylineID: storyline2._id,
			bookID: userAuthoredBookResponse1._id,
			prevChapterID: chapter1Response._id
		});

		expect(bookResponses.map((a) => a._id).sort()).toEqual(
			[
				userAuthoredBookResponse1._id,
				userAuthoredBookResponse2._id,
				userAuthoredBookResponse3._id
			].sort()
		);
	});
});
