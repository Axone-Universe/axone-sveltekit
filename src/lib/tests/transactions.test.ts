import { router } from '$lib/trpc/router';
import {
	cleanUpDatabase,
	connectDatabase,
	createDBUser,
	createTestSession,
	generateUserSessionData
} from '$lib/util/testing/testing';
import { AXONE_ADMIN_EMAIL } from '$env/static/private';

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
		const caller = router.createCaller({ session: testUserOneSession });
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

		console.log('** test txn');
		console.log(transaction);
		// confirm transaction payload
		expect(transaction.payload?.uuid).toEqual(payload_uuid);
		expect(transaction.sender?._id).toEqual(reader._id);
		expect(transaction.receiver?._id).toEqual(writer._id);
		expect(transaction.netValue).toEqual(1);
		expect(transaction.fee).toEqual(0.03);

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
		const caller = router.createCaller({ session: testUserOneSession });

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
		const webhookResponse = await caller.transactions.xaman({
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
		let caller = router.createCaller({ session: testUserOneSession });

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
		const webhookResponse = await caller.transactions.xaman({
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

		caller = router.createCaller({ session: testUserTwoSession });
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
});
