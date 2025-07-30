import { AXONE_ADMIN_EMAIL } from '$env/static/private';
import { router } from '$lib/trpc/router';
import {
	cleanUpDatabase,
	connectDatabase,
	createDBUser,
	createBook,
	createTestSession,
	createChapter,
	generateUserSessionData
} from '$lib/util/testing/testing';
import { Session } from '@supabase/supabase-js';
import { RequestEvent } from '@sveltejs/kit';
import { GET } from '../../routes/api/tokens/[id]/+server';

const payload_uuid = '854ef029-72ec-4031-99c0-e4af42250c71';

const qr_png_link = 'https://xumm.app/sign/854ef029-72ec-4031-99c0-e4af42250c71_q.png';

function mockXummSdk() {
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
}

beforeAll(async () => {
	await connectDatabase();
	mockXummSdk();
});

let adminUserSession: Session;

describe('resources', () => {
	beforeEach(async () => {
		await cleanUpDatabase();

		// create admin user
		adminUserSession = createTestSession(generateUserSessionData());
		adminUserSession.user.email = AXONE_ADMIN_EMAIL;
		await createDBUser(adminUserSession);
	});

	test('update resources', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(generateUserSessionData());

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// create chapter on default storyline
		const createChapterResponse = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		expect(createChapterResponse.data.description).toEqual('My chapter 1');

		// create resource
		const resourceCreateResponse = await caller.resources.create({
			chapterID: createChapterResponse.data._id,
			type: 'image'
		});

		expect(resourceCreateResponse.data.type).toEqual('image');
		expect(resourceCreateResponse.data.chapter).toEqual(createChapterResponse.data._id);

		// update resource
		const resourceUpdateResponse = await caller.resources.update({
			id: resourceCreateResponse.data._id,
			title: 'Reya dancing',
			description: 'Reya dancing after the snow had fallen',
			license: 'CC BY'
		});

		expect(resourceUpdateResponse.data.title).toEqual('Reya dancing');
		expect(resourceUpdateResponse.data.license).toEqual('CC BY');
	});

	test('create token', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(generateUserSessionData());

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// create chapter on default storyline
		const createChapterResponse = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		// create resource
		const resourceCreateResponse = await caller.resources.create({
			chapterID: createChapterResponse.data._id,
			type: 'image'
		});

		// update the resource
		await caller.resources.update({
			id: resourceCreateResponse.data._id,
			title: 'Reya dancing',
			description: 'Reya dancing after the snow had fallen',
			nftCollection: 'characters',
			properties: [{ name: 'hat', value: 'red' }]
		});

		// create the token
		const transaction = (
			await caller.xumm.createToken({
				resourceId: resourceCreateResponse.data._id
			})
		).data;

		// confirm transaction payload
		expect(transaction.payload?.uuid).toEqual(payload_uuid);
		expect(transaction.sender?._id).toEqual(adminUserSession.user.id);
		expect(transaction.receiver?._id).toEqual(testUserOneSession.user.id);
		expect(transaction.netValue).toEqual(0);
		expect(transaction.fee).toEqual(0);

		// confirm the token metadata
		const mockRequestEvent = {
			params: { id: resourceCreateResponse.data._id },
			request: new Request(`http://localhost:5173/api/tokens/`, {
				method: 'GET'
			})
		} as unknown as RequestEvent;

		const response = await GET(mockRequestEvent);
		const metadata = await response.json();

		expect(metadata.name).toEqual('Reya dancing');
	});

	test('delete resources', async () => {
		const chapter1Title = 'Chapter 1';
		const testBookTitle = 'My Book';
		const testUserOneSession = createTestSession(generateUserSessionData());

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		// create chapter on default storyline
		const createChapterResponse = await createChapter(
			testUserOneSession,
			chapter1Title,
			'My chapter 1',
			storylines[0]
		);

		expect(createChapterResponse.data.description).toEqual('My chapter 1');

		// create the resource
		const resourceCreateResponse = await caller.resources.create({
			chapterID: createChapterResponse.data._id,
			type: 'image'
		});

		await caller.resources.delete({
			id: resourceCreateResponse.data._id
		});

		const chapterNesources = await caller.resources.getByChapterID({
			chapterID: createChapterResponse.data._id
		});

		expect(chapterNesources.data.length).toEqual(0);
	});
});
