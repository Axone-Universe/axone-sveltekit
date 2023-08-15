import { beforeAll } from 'vitest';

import { router } from '$lib/trpc/router';
import { GenresBuilder } from '$lib/shared/genres';
import {
	cleanUpDatabase,
	connectDevDatabase,
	createDBUser,
	createTestSession,
	testUserOne,
	testUserTwo,
	testUserThree,
	createChapter
} from '$lib/util/testing/testing';

import type { Session } from '@supabase/supabase-js';

beforeAll(async () => {
	await connectDevDatabase();
	await cleanUpDatabase();
});

const createBook = async (title: string, testSession: Session) => {
	const caller = router.createCaller({ session: testSession });

	const genres = new GenresBuilder();
	genres.genre('Action');
	genres.genre('Adventure');
	genres.genre('Science Fiction');

	const book = await caller.books.create({
		title: title,
		description:
			'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of light, it was the season of darkness, it was the spring of hope, it was the winter of despair.',
		genres: genres.getGenres(),
		imageURL:
			'https://cdn.discordapp.com/attachments/1008571211179118703/1112713149867626496/taku_futuristic_4k_high_definition_image_of_african_financial_i_13f539da-a1d5-4b40-879c-c9d11443086e.png'
	});

	// set public permissions
	await caller.permissions.create({
		documentID: book._id,
		documentType: 'Book',
		permission: 'view',
		public: true
	});

	const storylines = await caller.storylines.getAll({
		bookID: book._id
	});

	await caller.permissions.create({
		documentID: storylines[0]._id,
		documentType: 'Storyline',
		permission: 'view',
		public: true
	});

	return book;
};

describe('db test data', () => {
	const testSessionOne = createTestSession(testUserOne);
	const testSessionTwo = createTestSession(testUserTwo);
	const testSessionThree = createTestSession(testUserThree);

	test('create users', async () => {
		const userResponse1 = await createDBUser(testSessionOne);
		const userResponse2 = await createDBUser(testSessionTwo);
		const userResponse3 = await createDBUser(testSessionThree);

		const caller = router.createCaller({ session: null });
		const userResponses = await caller.users.list();

		// compare sorted arrays to ignore element position differences (if any)
		expect(userResponses.map((a) => a._id).sort()).toEqual(
			[userResponse1._id, userResponse2._id, userResponse3._id].sort()
		);
	});

	test('create books', async () => {
		const testBookTitle1 = 'My Book 1';
		const testBookTitle2 = 'My Book 2';
		const testBookTitle3 = 'My Book 3';

		const userAuthoredBookResponse1 = await createBook(testBookTitle1, testSessionOne);
		const userAuthoredBookResponse2 = await createBook(testBookTitle2, testSessionTwo);
		const userAuthoredBookResponse3 = await createBook(testBookTitle3, testSessionThree);

		const caller = router.createCaller({ session: testSessionOne });
		const bookResponses = await caller.books.getAll();

		// Create chapters
		const chapter1Title = 'The Quantum Nexus';
		const chapter2_1Title = 'Echoes from Epsilon Prime';
		const chapter3_1Title = 'The Dark Nexus Unleashed';
		const chapter2_2Title = 'Echoes from Megadrones';

		const storylines = await caller.storylines.getAll({
			bookID: userAuthoredBookResponse1._id
		});

		const chapter1Response = await createChapter(
			testSessionOne,
			chapter1Title,
			`In a not-too-distant future, Dr. Samantha Walker, a brilliant physicist, 
		discovers a groundbreaking breakthrough in quantum technology. 
		With the ability to harness the power of the quantum realm, 
		she unveils a new method of transportation that promises to revolutionize interstellar travel. 
		As Samantha's invention catches the attention of powerful factions and sparks a race for control, 
		she finds herself at the center of a perilous adventure where the boundaries of reality blur and the 
		fate of the universe hangs in the balance.`,
			storylines[0]
		);

		const chapter2_1Response = await createChapter(
			testSessionTwo,
			chapter2_1Title,
			`While testing the limits of her quantum device, Samantha accidentally picks up a mysterious distress signal 
				from the distant planet of Epsilon Prime. Curiosity piqued, she assembles a team of experts and embarks on a 
				perilous journey to investigate the signal's origin. What they discover on Epsilon Prime is beyond their wildest 
				imaginations—an ancient civilization on the brink of extinction, struggling to preserve their knowledge and 
				existence. Samantha and her team must unravel the secrets of the planet and confront the enigmatic forces at 
				play if they hope to survive and bring hope to a dying world.`,
			storylines[0],
			chapter1Response._id
		);

		const chapter3_1Response = await createChapter(
			testSessionTwo,
			chapter3_1Title,
			`Back on Earth, Samantha's quantum technology becomes the subject of a global power struggle. The nefarious 
				organization known as the Dark Nexus, led by the enigmatic and ruthless Dr. Victor Thorn, seeks to harness the 
				quantum device's power for their own sinister agenda. As they unleash chaos and destruction, Samantha and her 
				team must gather their wits and allies to stop the Dark Nexus before it's too late. In a battle that spans 
				across dimensions, Samantha realizes the true extent of her invention's capabilities and the responsibility 
				she holds in shaping the destiny of humanity.`,
			storylines[0],
			chapter2_1Response._id
		);

		// Create a new storyline
		const storyline2 = await caller.storylines.create({
			title: 'Storyline 1',
			description: 'Storyline 1',
			book: userAuthoredBookResponse1._id,
			parent: storylines[0]._id,
			parentChapter: chapter1Response._id
		});

		await caller.permissions.create({
			documentID: storyline2._id,
			documentType: 'Storyline',
			permission: 'view',
			public: true
		});

		const chapter2_2Response = await createChapter(
			testSessionOne,
			chapter2_2Title,
			`While testing the limits of her quantum device, Samantha accidentally picks up a mysterious distress signal 
			from the distant planet of Megadrones. Curiosity piqued, she assembles a team of experts and embarks on a 
			perilous journey to investigate the signal's origin. What they discover on Epsilon Prime is beyond their wildest 
			imaginations—an ancient civilization on the brink of extinction, struggling to preserve their knowledge and 
			existence. Samantha and her team must unravel the secrets of the planet and confront the enigmatic forces at 
			play if they hope to survive and bring hope to a dying world.`,
			storyline2,
			chapter1Response._id
		);

		expect(bookResponses.map((a) => a._id).sort()).toEqual(
			[
				userAuthoredBookResponse1._id,
				userAuthoredBookResponse2._id,
				userAuthoredBookResponse3._id
			].sort()
		);
	});
});
