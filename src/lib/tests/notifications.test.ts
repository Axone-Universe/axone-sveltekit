import { router } from '$lib/trpc/router';
import { vi, expect, describe, test, beforeAll, beforeEach } from 'vitest';
import {
	cleanUpDatabase,
	connectDatabase,
	createDBUser,
	createBook,
	createCampaign,
	createTestSession,
	generateUserSessionData
} from '$lib/util/testing/testing';
import { PermissionPropertyBuilder } from '$lib/properties/permission';
import { AXONE_ADMIN_EMAIL } from '$env/static/private';
import * as permissionTriggers from '$lib/services/notifications/novu/triggers/permission';
import * as commentTriggers from '$lib/services/notifications/novu/triggers/comment';
import * as campaignTriggers from '$lib/services/notifications/novu/triggers/campaign';
import * as transactionTriggers from '$lib/services/notifications/novu/triggers/transaction';

const payload_uuid = '854ef029-72ec-4031-99c0-e4af42250c71';
const qr_png_link = 'https://xumm.app/sign/854ef029-72ec-4031-99c0-e4af42250c71_q.png';
const txId = '123456';

function mockXummSdk() {
	vi.mock('$lib/services/xumm', async () => {
		const actual = await vi.importActual<typeof import('$lib/services/xumm')>('$lib/services/xumm');
		return {
			...actual,
			xummSdk: {
				getRates: vi.fn(() =>
					Promise.resolve({
						USD: 1,
						XRP: 1,
						__meta: {
							currency: {
								en: 'XRP',
								code: 'XRP',
								symbol: 'XRP',
								isoDecimals: 4
							}
						}
					})
				),
				payload: {
					create: vi.fn(() =>
						Promise.resolve({
							uuid: payload_uuid,
							next: {
								always: 'https://xumm.app/sign/854ef029-72ec-4031-99c0-e4af42250c71'
							},
							refs: {
								qr_png: qr_png_link,
								qr_matrix: 'https://xumm.app/sign/854ef029-72ec-4031-99c0-e4af42250c71_q.json',
								qr_uri_quality_opts: ['m', 'q', 'h'],
								websocket_status: 'wss://xumm.app/sign/854ef029-72ec-4031-99c0-e4af42250c71'
							},
							pushed: false
						})
					)
				}
			}
		};
	});
}

beforeAll(async () => {
	await connectDatabase();
	mockXummSdk();
});

describe('notifications', () => {
	let mockTriggerPermissionWorkflow: ReturnType<typeof vi.fn>;
	let mockTriggerNewCommentWorkflow: ReturnType<typeof vi.fn>;
	let mockTriggerNewCampaignWorkflow: ReturnType<typeof vi.fn>;
	let mockTriggerCampaignWinnersWorkflow: ReturnType<typeof vi.fn>;
	let mockTriggerTransactionProcessedWorkflow: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		await cleanUpDatabase();
		// Mock all trigger functions
		mockTriggerPermissionWorkflow = vi.fn().mockResolvedValue(undefined);
		mockTriggerNewCommentWorkflow = vi.fn().mockResolvedValue(undefined);
		mockTriggerNewCampaignWorkflow = vi.fn().mockResolvedValue(undefined);
		mockTriggerCampaignWinnersWorkflow = vi.fn().mockResolvedValue(undefined);
		mockTriggerTransactionProcessedWorkflow = vi.fn().mockResolvedValue(undefined);

		vi.spyOn(permissionTriggers, 'triggerPermissionWorkflow').mockImplementation(
			mockTriggerPermissionWorkflow as (args_0: any) => Promise<void>
		);
		vi.spyOn(commentTriggers, 'triggerNewCommentWorkflow').mockImplementation(
			mockTriggerNewCommentWorkflow as (args_0: any) => Promise<void>
		);

		vi.spyOn(campaignTriggers, 'triggerNewCampaignWorkflow').mockImplementation(
			mockTriggerNewCampaignWorkflow as (args_0: any) => Promise<void>
		);
		vi.spyOn(campaignTriggers, 'triggerCampaignWinnersWorkflow').mockImplementation(
			mockTriggerCampaignWinnersWorkflow as (args_0: any) => Promise<void>
		);
		vi.spyOn(transactionTriggers, 'triggerTransactionProcessedWorkflow').mockImplementation(
			mockTriggerTransactionProcessedWorkflow as (args_0: any) => Promise<void>
		);
	});

	test('triggerPermissionWorkflow - triggers when creating chapter with permissions', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		const testUserOneDB = (await createDBUser(testUserOneSession)).data;
		const testUserTwoDB = (await createDBUser(testUserTwoSession)).data;

		const bookResponse = await createBook(testUserOneSession, testUserOneDB, 'My Book');

		// Get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// Create a permission for testUserTwo
		const permission = new PermissionPropertyBuilder().getProperties();
		permission.permission = 'collaborate';
		permission._id = ''; // Empty _id indicates new permission

		// Create a chapter with permissions for testUserTwo
		const chapterResponse = await caller.chapters.create({
			title: 'Test Chapter',
			description: 'Test Description',
			bookID: bookResponse.data._id,
			storylineID: storylines[0]._id,
			permissions: {
				[testUserTwoDB._id]: permission
			}
		});

		// Verify that triggerPermissionWorkflow was called
		expect(mockTriggerPermissionWorkflow).toHaveBeenCalledWith({
			documentType: 'Chapter',
			documentId: chapterResponse.data._id,
			senderId: testUserOneDB._id,
			receiverId: testUserTwoDB._id
		});
	});

	test('triggerPermissionWorkflow - triggers when updating storyline with new permissions', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		const testUserOneDB = (await createDBUser(testUserOneSession)).data;
		const testUserTwoDB = (await createDBUser(testUserTwoSession)).data;

		const bookResponse = await createBook(testUserOneSession, testUserOneDB, 'My Book');

		// Get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// Create a permission for testUserTwo
		const permission = new PermissionPropertyBuilder().getProperties();
		permission.permission = 'collaborate';
		permission._id = ''; // Empty _id indicates new permission

		// Update storyline with new permissions for testUserTwo
		await caller.storylines.update({
			id: storylines[0]._id,
			permissions: {
				[testUserTwoDB._id]: permission
			}
		});

		// Verify that triggerPermissionWorkflow was called
		expect(mockTriggerPermissionWorkflow).toHaveBeenCalledWith({
			documentType: 'Storyline',
			documentId: storylines[0]._id,
			senderId: testUserOneDB._id,
			receiverId: testUserTwoDB._id
		});
	});

	test('triggerNewCommentWorkflow - triggers when creating comment on chapter owned by another user', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		const testUserOneDB = (await createDBUser(testUserOneSession)).data;
		const testUserTwoDB = (await createDBUser(testUserTwoSession)).data;

		const bookResponse = await createBook(testUserOneSession, testUserOneDB, 'My Book');

		// Get the default storyline from created book
		const callerOne = router.createCaller({ session: testUserOneSession, user: testUserOneDB });
		const storylines = (
			await callerOne.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// Create a chapter owned by testUserOne
		const chapterResponse = await callerOne.chapters.create({
			title: 'Test Chapter',
			description: 'Test Description',
			bookID: bookResponse.data._id,
			storylineID: storylines[0]._id
		});

		// Create a comment as testUserTwo
		const callerTwo = router.createCaller({ session: testUserTwoSession, user: testUserTwoDB });
		const commentResponse = await callerTwo.chapters.createComment({
			chapterId: chapterResponse.data._id,
			comment: 'Great chapter!'
		});

		// Verify that triggerNewCommentWorkflow was called
		expect(mockTriggerNewCommentWorkflow).toHaveBeenCalledWith({
			chapterId: chapterResponse.data._id,
			commentId: commentResponse.data._id,
			recipientId: testUserOneDB._id
		});
	});

	test('triggerNewCommentWorkflow - does not trigger when commenter is chapter owner', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserOneDB = (await createDBUser(testUserOneSession)).data;

		const bookResponse = await createBook(testUserOneSession, testUserOneDB, 'My Book');

		// Get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// Create a chapter owned by testUserOne
		const chapterResponse = await caller.chapters.create({
			title: 'Test Chapter',
			description: 'Test Description',
			bookID: bookResponse.data._id,
			storylineID: storylines[0]._id
		});

		// Reset the mock to count only new-comment calls
		mockTriggerNewCommentWorkflow.mockClear();

		// Create a comment as the chapter owner (testUserOne)
		await caller.chapters.createComment({
			chapterId: chapterResponse.data._id,
			comment: 'My own comment'
		});

		// Verify that triggerNewCommentWorkflow was NOT called
		expect(mockTriggerNewCommentWorkflow).not.toHaveBeenCalled();
	});

	test('triggerNewCampaignWorkflow - triggers when creating a campaign', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserOneDB = (await createDBUser(testUserOneSession)).data;

		// Create a campaign
		const campaignBook = await createCampaign(testUserOneSession, testUserOneDB, 'Campaign Book');

		// Get the campaign ID from the book
		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });
		const book = (await caller.books.getById({ id: campaignBook._id })).data;
		const campaignId = typeof book.campaign === 'string' ? book.campaign : book.campaign?._id ?? '';

		// Verify that triggerNewCampaignWorkflow was called
		expect(mockTriggerNewCampaignWorkflow).toHaveBeenCalledWith({
			campaignId: campaignId
		});
	});

	test('triggerCampaignWinnersWorkflow - triggers when updating campaign with winners', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		const testUserOneDB = (await createDBUser(testUserOneSession)).data;
		const testUserTwoDB = (await createDBUser(testUserTwoSession)).data;

		// Create a campaign
		const campaignBook = await createCampaign(testUserOneSession, testUserOneDB, 'Campaign Book');

		// Get the campaign ID from the book
		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });
		const book = (await caller.books.getById({ id: campaignBook._id })).data;
		const campaignId = typeof book.campaign === 'string' ? book.campaign : book.campaign?._id ?? '';

		// Reset the mock to count only campaign-winners calls
		mockTriggerCampaignWinnersWorkflow.mockClear();

		// Update campaign with winners (winners is an array of user IDs)
		await caller.campaigns.update({
			id: campaignId,
			winners: [testUserTwoDB._id]
		});

		// Verify that triggerCampaignWinnersWorkflow was called
		expect(mockTriggerCampaignWinnersWorkflow).toHaveBeenCalledWith({
			campaignId: campaignId
		});
	});

	test('triggerTransactionProcessedWorkflow - triggers when transaction is processed', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		const testUserOneDB = (await createDBUser(testUserOneSession)).data;
		const testUserTwoDB = (await createDBUser(testUserTwoSession)).data;

		// Create admin user for transaction processing
		const adminUserSession = createTestSession(generateUserSessionData());
		adminUserSession.user.email = AXONE_ADMIN_EMAIL;
		await createDBUser(adminUserSession);

		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });

		// Create a transaction payload
		const payloadResponse = await caller.xumm.payload({
			transactionType: 'Payment',
			netValue: 1,
			documentType: 'Chapter',
			documentId: '1',
			receiver: testUserTwoDB._id,
			note: 'test payment',
			currency: 'XRP'
		});

		const payloadId = payloadResponse.data?.payload?.uuid;
		expect(payloadId).toBeDefined();

		// Reset the mock to count only transaction-processed calls
		mockTriggerTransactionProcessedWorkflow.mockClear();

		// Process the transaction via webhook
		await caller.xumm.webhook({
			meta: {
				url: '',
				application_uuidv4: '',
				payload_uuidv4: payloadId,
				opened_by_deeplink: true
			},
			custom_meta: {
				identifier: null,
				blob: null,
				instruction: null
			},
			payloadResponse: {
				payload_uuidv4: payloadId,
				reference_call_uuidv4: '',
				signed: true,
				user_token: true,
				return_url: {
					app: null,
					web: null
				},
				txid: txId
			},
			userToken: null
		});

		// Get the completed transaction
		const transaction = (
			await caller.transactions.getByPayloadId({
				payloadId: payloadId
			})
		).data;

		// Verify that triggerTransactionProcessedWorkflow was called
		expect(mockTriggerTransactionProcessedWorkflow).toHaveBeenCalledWith({
			transactionId: transaction._id,
			receiverId: testUserTwoDB._id
		});
	});
});
