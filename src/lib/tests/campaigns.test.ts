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
		const campaignResponse = await caller1.campaigns.create({
			startDate,
			endDate,
			submissionCriteria,
			rewards,
			book,
			origin: ''
		});

		const campaign = campaignResponse.data;

		const createdBook = (await caller1.books.getById({ id: campaign.book })).data;

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

		const campaign = (
			await caller1.campaigns.create({
				startDate,
				endDate,
				submissionCriteria,
				rewards,
				book,
				origin: ''
			})
		).data;

		await caller1.campaigns.update({
			id: campaign._id,
			submissionCriteria: newSubmissionCriteria,
			book: {
				...book,
				id: campaign.book!,
				title: newTitle
			}
		});

		const returnedBook = (await caller1.books.getById({ id: campaign.book })).data;
		const returnedCampaign = returnedBook.campaign as HydratedDocument<CampaignProperties>;

		expect(returnedCampaign.submissionCriteria).toEqual(newSubmissionCriteria);
		expect(returnedCampaign.startDate).toEqual(startDate);
		expect(returnedCampaign.endDate).toEqual(endDate);
		expect(returnedCampaign.updatedAt).greaterThan(returnedCampaign.createdAt!);
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

		const campaign = (
			await caller1.campaigns.create({
				startDate,
				endDate,
				submissionCriteria,
				rewards,
				book,
				origin: ''
			})
		).data;

		const updateResponse = await caller2.campaigns.update({
			id: campaign._id,
			submissionCriteria: newSubmissionCriteria,
			book: {
				...book,
				id: campaign.book!,
				title: newTitle
			}
		});

		console.log(updateResponse.message);
		expect(updateResponse.message.includes('INTERNAL_SERVER_ERROR')).toEqual(true);
	});

	test('storylines creation', async () => {
		startDate.setDate(startDate.getDate() - 1);
		endDate.setDate(endDate.getDate() + 1);

		const campaignResponse = await caller1.campaigns.create({
			startDate,
			endDate,
			submissionCriteria,
			rewards,
			book,
			origin: ''
		});

		const campaign = campaignResponse.data;

		const createdBook = (await caller1.books.getById({ id: campaign.book })).data;

		// create a storyline for the campaign
		let storylineCreateResponse = await caller1.storylines.create({
			title: 'Storyline 1',
			description: 'Storyline 1',
			book: createdBook._id
		});

		startDate.setDate(startDate.getDate() - 4);
		endDate.setDate(endDate.getDate() - 3);

		await caller1.campaigns.update({
			id: campaign._id,
			startDate: startDate,
			endDate: endDate
		});

		// create a storyline for ended campaign
		storylineCreateResponse = await caller1.storylines.create({
			title: 'Storyline 2',
			description: 'Storyline 2',
			book: createdBook._id
		});

		expect(storylineCreateResponse.success).toEqual(false);
		expect(storylineCreateResponse.message).toContain(
			'This campaign has ended. No more entries allowed'
		);
	});

	test('get campaigns', async () => {
		for (let i = 0; i < 5; i++) {
			await caller1.campaigns.create({
				startDate,
				endDate,
				submissionCriteria,
				rewards,
				book,
				origin: ''
			});
		}

		const campaignsResponse = await caller1.campaigns.get({
			limit: 3
		});

		expect(campaignsResponse.data.length).toEqual(3);

		const moreCampaigns = await caller1.campaigns.get({
			limit: 3,
			cursor: campaignsResponse.cursor
		});

		expect(moreCampaigns.data.length).toEqual(2);

		expect(campaignsResponse.data[0].startDate).toEqual(startDate);
		expect(campaignsResponse.data[0].endDate).toEqual(endDate);
		expect(campaignsResponse.data[0].submissionCriteria).toEqual(submissionCriteria);
		expect(campaignsResponse.data[0].rewards).toEqual(rewards);
		expect(campaignsResponse.data[0].book).toBeTruthy();
	});

	test('delete a campaign', async () => {
		const createCampaignResponse = await caller1.campaigns.create({
			startDate,
			endDate,
			submissionCriteria,
			rewards,
			book,
			origin: ''
		});

		const campaign = createCampaignResponse.data;

		// first delete the storyline
		const storylineResponse = await caller1.storylines.getByBookID({
			bookID: campaign.book!
		});

		await caller1.storylines.delete({
			id: storylineResponse.data[0]._id
		});

		// second delete the book
		const deletBookResponse = await caller1.books.delete({ id: campaign.book! });

		expect(deletBookResponse.success).toEqual(true);
		expect(deletBookResponse.message).toContain('book successfully deleted');

		// check that campaign has been deleted
		const campaignResponse = await caller1.campaigns.get({ id: campaign._id });
		expect(campaignResponse.data.length).toEqual(0);
	});
});
