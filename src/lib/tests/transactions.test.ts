import { router } from '$lib/trpc/router';
import { xummSdk } from '$lib/services/xumm';
import {
	cleanUpDatabase,
	connectTestDatabase,
	createDBUser,
	createTestSession,
	testUserOne,
	testUserTwo
} from '$lib/util/testing/testing';

const payload_uuid = '854ef029-72ec-4031-99c0-e4af42250c71';
const qr_png_link = 'https://xumm.app/sign/854ef029-72ec-4031-99c0-e4af42250c71_q.png';
const txId = '123456';

vi.mock('$lib/services/xumm', async () => {
	const actual = await vi.importActual<typeof import('$lib/services/xumm')>('$lib/services/xumm');
	return {
		...actual,
		xummSdk: {
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

beforeAll(async () => {
	await connectTestDatabase();
});

describe('transactions', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('create transaction', async () => {
		const testUserOneSession = createTestSession(testUserOne);
		const testUserTwoSession = createTestSession(testUserTwo);

		const reader = (await createDBUser(testUserOneSession)).data;
		const writer = (await createDBUser(testUserTwoSession)).data;

		// pay writer
		const caller = router.createCaller({ session: testUserOneSession });
		const transaction = (
			await caller.xumm.payload({
				transactionType: 'Payment',
				baseValue: 1.03,
				baseNetValue: 1,
				documentType: 'Chapter',
				documentId: '1',
				receiver: writer._id,
				note: 'great work!',
				fee: 0.03,
				currency: 'XRP',
				exchangeRate: 1
			})
		).data;

		// confirm transaction payload
		expect(transaction.payload?.uuid).toEqual(payload_uuid);
		expect(transaction.sender?._id).toEqual(reader._id);
		expect(transaction.receiver?._id).toEqual(writer._id);

		// confirm an account has been created
		const account = (
			await caller.accounts.getByUserId({
				userId: writer._id ?? ''
			})
		).data;

		expect(account.currency).toEqual('USD');
		expect(account.balance).toEqual(0);
	});

	test('sign transaction', async () => {
		const testUserOneSession = createTestSession(testUserOne);
		const testUserTwoSession = createTestSession(testUserTwo);

		const reader = (await createDBUser(testUserOneSession)).data;
		const writer = (await createDBUser(testUserTwoSession)).data;

		// pay writer
		const caller = router.createCaller({ session: testUserOneSession });

		// create payload
		await caller.xumm.payload({
			transactionType: 'Payment',
			baseValue: 1.03,
			baseNetValue: 1,
			documentType: 'Chapter',
			documentId: '1',
			receiver: writer._id,
			note: 'great work!',
			fee: 0.03,
			currency: 'XRP',
			exchangeRate: 2
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
});
