import type { CampaignProperties } from '$lib/properties/campaign';
import { router } from '$lib/trpc/router';
import type { CreateBook } from '$lib/trpc/schemas/books';
import {
	connectTestDatabase,
	cleanUpDatabase,
	createDBUser,
	createTestSession,
	generateTestUser
} from '$lib/util/testing/testing';
import type { HydratedDocument } from 'mongoose';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('campaigns', async () => {
	const testUserOneSession = createTestSession(generateTestUser());
	const testUserTwoSession = createTestSession(generateTestUser());
	const testUserThreeSession = createTestSession(generateTestUser());
	const caller1 = router.createCaller({ session: testUserOneSession });
	const caller2 = router.createCaller({ session: testUserTwoSession });
	const caller3 = router.createCaller({ session: testUserThreeSession });

	const startDate = new Date();
	const endDate = new Date();
	const submissionCriteria =
		'Submit a 10 chapter storyline revolving around a prophesized hero in an unfamiliar world.';
	const rewards = 'R1 000 000 in cold, hard cash.';
	const book: CreateBook = {
		title: 'Fantasy Fanatics 2023',
		description:
			'Calling all fantasy enjoyes! Come and write some glorious storylines and win mythical prizes.',
		imageURL: 'https://picsum.photos/200/300',
		genres: ['Fantasy'],
		permissions: {
			public: {
				_id: 'public',
				permission: 'collaborate'
			}
		}
	};

	beforeEach(async () => {
		await cleanUpDatabase();
		await createDBUser(testUserOneSession);
		await createDBUser(testUserTwoSession);
		await createDBUser(testUserThreeSession);
	});

	test('create a campaign', async () => {
		const campaign = await caller1.campaigns.create({
			startDate,
			endDate,
			submissionCriteria,
			rewards,
			book
		});

		const createdBook = await caller1.books.getById({ id: campaign.book });

		expect(campaign.startDate).toEqual(startDate);
		expect(campaign.endDate).toEqual(endDate);
		expect(campaign.submissionCriteria).toEqual(submissionCriteria);
		expect(campaign.rewards).toEqual(rewards);
		expect(campaign.book).toEqual(createdBook._id);

		expect(createdBook.title).toEqual(book.title);
		expect(createdBook.description).toEqual(book.description);
		expect(createdBook.imageURL).toEqual(book.imageURL);
		expect(createdBook.genres).toEqual(book.genres);
		expect(createdBook.permissions).toEqual(book.permissions);
	});

	test('update a campaign as creator', async () => {
		const newSubmissionCriteria =
			'Submit a 5 chapter storyline revolving around a kingdom under siege from dark forces.';
		const newTitle = 'Repelling Evil';

		const campaign = await caller1.campaigns.create({
			startDate,
			endDate,
			submissionCriteria,
			rewards,
			book
		});

		await caller1.campaigns.update({
			id: campaign._id,
			submissionCriteria: newSubmissionCriteria,
			book: {
				...book,
				id: campaign.book!,
				title: newTitle
			}
		});

		const returnedBook = await caller1.books.getById({ id: campaign.book });
		const returnedCampaign = returnedBook.campaign as HydratedDocument<CampaignProperties>;

		expect(returnedCampaign.submissionCriteria).toEqual(newSubmissionCriteria);
		expect(returnedCampaign.startDate).toEqual(startDate);
		expect(returnedCampaign.endDate).toEqual(endDate);
		expect(returnedCampaign.rewards).toEqual(rewards);

		expect(returnedBook.title).toEqual(newTitle);
		expect(returnedBook.description).toEqual(book.description);
		expect(returnedBook.imageURL).toEqual(book.imageURL);
		expect(returnedBook.genres).toEqual(book.genres);
		expect(returnedBook.permissions).toEqual(book.permissions);
	});

	test('throws on updating campaign without being its creator', async () => {
		const newSubmissionCriteria =
			'Submit a 5 chapter storyline revolving around a kingdom under siege from dark forces.';
		const newTitle = 'Repelling Evil';

		const campaign = await caller1.campaigns.create({
			startDate,
			endDate,
			submissionCriteria,
			rewards,
			book
		});

		expect(
			async () =>
				await caller2.campaigns.update({
					id: campaign._id,
					submissionCriteria: newSubmissionCriteria,
					book: {
						...book,
						id: campaign.book!,
						title: newTitle
					}
				})
		).rejects.toThrowError();
	});

	test('get campaigns', async () => {
		for (let i = 0; i < 5; i++) {
			await caller1.campaigns.create({
				startDate,
				endDate,
				submissionCriteria,
				rewards,
				book
			});
		}

		const campaigns = await caller1.campaigns.get({
			limit: 3
		});

		expect(campaigns.result.length).toEqual(3);

		const moreCampaigns = await caller1.campaigns.get({
			limit: 3,
			cursor: campaigns.cursor
		});

		expect(moreCampaigns.result.length).toEqual(2);

		expect(campaigns.result[0].startDate).toEqual(startDate);
		expect(campaigns.result[0].endDate).toEqual(endDate);
		expect(campaigns.result[0].submissionCriteria).toEqual(submissionCriteria);
		expect(campaigns.result[0].rewards).toEqual(rewards);
		expect(campaigns.result[0].book).toBeTruthy();
	});
});
