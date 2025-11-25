import { router } from '$lib/trpc/router';
import {
	cleanUpDatabase,
	connectDatabase,
	createDBUser,
	createTestSession,
	generateUserSessionData
} from '$lib/util/testing/testing';
import { AXONE_ADMIN_EMAIL } from '$env/static/private';
import { rewardTiers } from '$lib/util/constants';

const payload_uuid_1 = '854ef029-72ec-4031-99c0-e4af42250c71';
const payload_uuid_2 = '854ef029-72ec-4031-99c0-e4af42250c72';

let payload_uuid = payload_uuid_1;

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

describe('transactions', () => {
	beforeEach(async () => {
		await cleanUpDatabase();

		// create admin user
		const adminUserSession = createTestSession(generateUserSessionData());
		adminUserSession.user.email = AXONE_ADMIN_EMAIL;
		await createDBUser(adminUserSession);
	});

	test('create transaction', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		const reader = (await createDBUser(testUserOneSession)).data;
		const writer = (await createDBUser(testUserTwoSession)).data;

		// pay writer
		const caller = router.createCaller({ session: testUserOneSession, user: reader });
		const transaction = (
			await caller.xumm.payload({
				transactionType: 'Payment',
				netValue: 1,
				documentType: 'Chapter',
				documentId: '1',
				receiver: writer._id,
				note: 'great work!',
				currency: 'XRP'
			})
		).data;

		// confirm transaction payload
		expect(transaction.payload?.uuid).toEqual(payload_uuid);
		expect(transaction.sender).toEqual(reader._id);
		expect(transaction.receiver).toEqual(writer._id);
		expect(transaction.netValue).toEqual(1);
		expect(transaction.platformFee).toEqual(0.03);

		// confirm an account has been created
		const account = (
			await caller.accounts.getByUserId({
				userId: writer._id ?? ''
			})
		).data;

		expect(account.currency).toEqual('XRP');
		expect(account.balance).toEqual(0);
	});

	test('sign transaction', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		const reader = (await createDBUser(testUserOneSession)).data;
		const writer = (await createDBUser(testUserTwoSession)).data;

		// pay writer
		const caller = router.createCaller({ session: testUserOneSession, user: reader });

		// create payload
		await caller.xumm.payload({
			transactionType: 'Payment',
			netValue: 1,
			documentType: 'Chapter',
			documentId: '1',
			receiver: writer._id,
			note: 'great work!',
			currency: 'XRP'
		});

		// call the xaman transaction webhook
		const webhookResponse = await caller.xumm.webhook({
			meta: {
				url: '',
				application_uuidv4: '',
				payload_uuidv4: payload_uuid,
				opened_by_deeplink: true
			},
			custom_meta: {
				identifier: null,
				blob: null,
				instruction: null
			},
			payloadResponse: {
				payload_uuidv4: payload_uuid,
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

		expect(webhookResponse.success).toEqual(true);

		// get the completed transaction
		const transaction = (
			await caller.transactions.getByPayloadId({
				payloadId: payload_uuid
			})
		).data;

		expect(transaction.status).toEqual('success');
		expect(transaction.externalId).toEqual(txId);
		expect(transaction.note).toEqual('great work!');

		// get the account
		const account = (
			await caller.accounts.getByUserId({
				userId: writer._id
			})
		).data;

		expect(account.balance).toEqual(1);
	});

	test('cancel transaction', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

		const reader = (await createDBUser(testUserOneSession)).data;
		const writer = (await createDBUser(testUserTwoSession)).data;

		// pay writer
		let caller = router.createCaller({ session: testUserOneSession, user: reader });

		// create payload
		await caller.xumm.payload({
			transactionType: 'Payment',
			netValue: 1,
			documentType: 'Chapter',
			documentId: '1',
			receiver: writer._id,
			note: 'great work!',
			currency: 'XRP'
		});

		// call the xaman transaction webhook
		const webhookResponse = await caller.xumm.webhook({
			meta: {
				url: '',
				application_uuidv4: '',
				payload_uuidv4: payload_uuid,
				opened_by_deeplink: true
			},
			custom_meta: {
				identifier: null,
				blob: null,
				instruction: null
			},
			payloadResponse: {
				payload_uuidv4: payload_uuid,
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

		expect(webhookResponse.success).toEqual(true);

		// get the completed transaction
		let transaction = (
			await caller.transactions.getByPayloadId({
				payloadId: payload_uuid
			})
		).data;

		expect(transaction.status).toEqual('success');
		expect(transaction.externalId).toEqual(txId);
		expect(transaction.note).toEqual('great work!');

		// get the account
		let account = (
			await caller.accounts.getByUserId({
				userId: writer._id
			})
		).data;

		expect(account.balance).toEqual(1);

		// create a withdrawal transaction
		payload_uuid = payload_uuid_2;
		mockXummSdk();

		caller = router.createCaller({ session: testUserTwoSession, user: writer });
		const withdrawResponse = await caller.accounts.withdraw({
			id: account._id!,
			receiverAddress: 'xxxx'
		});

		// check the withdrawal transaction
		transaction = (
			await caller.transactions.getByPayloadId({
				payloadId: payload_uuid_2
			})
		).data;

		expect(withdrawResponse.data.balance).toEqual(0);
		expect(transaction.status).toEqual('pending');
		expect(transaction.type).toEqual('Withdrawal');

		// cancel withdrawal transaction
		const cancelResponse = await caller.transactions.cancel({
			id: transaction._id!
		});

		expect(cancelResponse.data.deletedCount).toEqual(1);

		// check the account balance is positive again after cancellation
		account = (
			await caller.accounts.getByUserId({
				userId: writer._id
			})
		).data;

		expect(account.balance).toEqual(1);
	});

	test('redeem reward - successful redemption', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserOneDB = (await createDBUser(testUserOneSession)).data;

		// Create 5 referred users (50 points total)
		for (let i = 0; i < 5; i++) {
			const referredUserSession = createTestSession(generateUserSessionData());
			const caller = router.createCaller({ session: referredUserSession, user: undefined });
			await caller.users.create({
				firstName: referredUserSession.user.user_metadata.firstName,
				lastName: referredUserSession.user.user_metadata.lastName,
				email: referredUserSession.user.email,
				referralSource: 'Referral',
				referralUser: testUserOneDB._id
			});
		}

		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });

		// Try to redeem R100 voucher (should fail - insufficient points, only has 50)
		const r100Tier = rewardTiers[0]; // R100 Takealot Voucher
		let response = await caller.transactions.redeemReward({
			points: r100Tier.points,
			rewardType: r100Tier.rewardType,
			rewardValue: r100Tier.value,
			currency: r100Tier.currency
		});

		expect(response.success).toEqual(false);
		expect(response.message).toEqual('Insufficient points');

		// Create a custom reward for testing with 30 points (not in standard tiers)
		// This tests a scenario with fewer points than the minimum tier
		response = await caller.transactions.redeemReward({
			points: 30,
			rewardType: 'takealot_voucher',
			rewardValue: 30,
			currency: 'ZAR'
		});

		expect(response.success).toEqual(true);
		expect(response.data.pointsRedeemed).toEqual(30);
		expect(response.data.remainingPoints).toEqual(20);
		expect(response.data.redemptionTransaction).toBeDefined();
		expect(response.data.withdrawalTransaction).toBeDefined();
		expect(response.data.account).toBeDefined();

		// Verify redemption transaction
		expect(response.data.redemptionTransaction.type).toEqual('Redemption');
		expect(response.data.redemptionTransaction.status).toEqual('success');
		expect(response.data.redemptionTransaction.documentId).toEqual('30'); // Points stored in documentId
		expect(response.data.redemptionTransaction.value).toEqual(30); // Value stored as-is, not in smallest unit
		expect(response.data.redemptionTransaction.currency).toEqual('ZAR');

		// Verify withdrawal transaction
		expect(response.data.withdrawalTransaction.type).toEqual('Withdrawal');
		expect(response.data.withdrawalTransaction.status).toEqual('pending');
		expect(response.data.withdrawalTransaction.currency).toEqual('ZAR');

		// Verify account was created/updated
		expect(response.data.account.currency).toEqual('ZAR');
		expect(response.data.account.balance).toEqual(0);
	});

	test('redeem reward - multiple redemptions', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserOneDB = (await createDBUser(testUserOneSession)).data;

		// Create 10 referred users (100 points total)
		for (let i = 0; i < 10; i++) {
			const referredUserSession = createTestSession(generateUserSessionData());
			const caller = router.createCaller({ session: referredUserSession, user: undefined });
			await caller.users.create({
				firstName: referredUserSession.user.user_metadata.firstName,
				lastName: referredUserSession.user.user_metadata.lastName,
				email: referredUserSession.user.email,
				referralSource: 'Referral',
				referralUser: testUserOneDB._id
			});
		}

		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });

		// First redemption: R100 voucher (100 points)
		const r100Tier = rewardTiers[0]; // R100 Takealot Voucher
		let response = await caller.transactions.redeemReward({
			points: r100Tier.points,
			rewardType: r100Tier.rewardType,
			rewardValue: r100Tier.value,
			currency: r100Tier.currency
		});

		expect(response.success).toEqual(true);
		expect(response.data.remainingPoints).toEqual(0);

		// Create more referrals to test second redemption
		for (let i = 0; i < 3; i++) {
			const referredUserSession = createTestSession(generateUserSessionData());
			const referredCaller = router.createCaller({
				session: referredUserSession,
				user: undefined
			});
			await referredCaller.users.create({
				firstName: referredUserSession.user.user_metadata.firstName,
				lastName: referredUserSession.user.user_metadata.lastName,
				email: referredUserSession.user.email,
				referralSource: 'Referral',
				referralUser: testUserOneDB._id
			});
		}

		// Second redemption: custom 30 points voucher
		response = await caller.transactions.redeemReward({
			points: 30,
			rewardType: 'takealot_voucher',
			rewardValue: 30,
			currency: 'ZAR'
		});

		expect(response.success).toEqual(true);
		expect(response.data.remainingPoints).toEqual(0);

		// Third redemption: should fail - no points remaining
		response = await caller.transactions.redeemReward({
			points: 25,
			rewardType: 'takealot_voucher',
			rewardValue: 25,
			currency: 'ZAR'
		});

		expect(response.success).toEqual(false);
		expect(response.message).toEqual('Insufficient points');
	});

	test('redeem reward - account creation for USD', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserOneDB = (await createDBUser(testUserOneSession)).data;

		// Create 3 referred users (30 points total)
		for (let i = 0; i < 3; i++) {
			const referredUserSession = createTestSession(generateUserSessionData());
			const caller = router.createCaller({ session: referredUserSession, user: undefined });
			await caller.users.create({
				firstName: referredUserSession.user.user_metadata.firstName,
				lastName: referredUserSession.user.user_metadata.lastName,
				email: referredUserSession.user.email,
				referralSource: 'Referral',
				referralUser: testUserOneDB._id
			});
		}

		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });

		// Redeem reward - should create ZAR account if it doesn't exist
		const response = await caller.transactions.redeemReward({
			points: 20,
			rewardType: 'takealot_voucher',
			rewardValue: 20,
			currency: 'ZAR'
		});

		expect(response.success).toEqual(true);
		expect(response.data.account.currency).toEqual('ZAR');
		expect(response.data.account.balance).toEqual(0);
	});

	test('redeem reward - verifies points calculation correctly', async () => {
		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserOneDB = (await createDBUser(testUserOneSession)).data;

		// Create 7 referred users (70 points total)
		for (let i = 0; i < 7; i++) {
			const referredUserSession = createTestSession(generateUserSessionData());
			const caller = router.createCaller({ session: referredUserSession, user: undefined });
			await caller.users.create({
				firstName: referredUserSession.user.user_metadata.firstName,
				lastName: referredUserSession.user.user_metadata.lastName,
				email: referredUserSession.user.email,
				referralSource: 'Referral',
				referralUser: testUserOneDB._id
			});
		}

		const caller = router.createCaller({ session: testUserOneSession, user: testUserOneDB });

		// Redeem 40 points (custom reward, not in standard tiers)
		const response = await caller.transactions.redeemReward({
			points: 40,
			rewardType: 'takealot_voucher',
			rewardValue: 40,
			currency: 'ZAR'
		});

		expect(response.success).toEqual(true);
		expect(response.data.pointsRedeemed).toEqual(40);
		expect(response.data.remainingPoints).toEqual(30); // 70 - 40 = 30

		// Verify the redemption transaction stores points in documentId
		expect(response.data.redemptionTransaction.documentId).toEqual('40');
		expect(response.data.redemptionTransaction.value).toEqual(40); // Value stored as-is
		expect(response.data.redemptionTransaction.currency).toEqual('ZAR');
	});
});
