import { router } from '$lib/trpc/router';
import { vi, expect, describe } from 'vitest';
import { novu } from '$lib/util/notifications/novu';
import {
	cleanUpDatabase,
	connectTestDatabase,
	createDBUser,
	createBook,
	createTestSession,
	testUserOne,
	testUserTwo
} from '$lib/util/testing/testing';
import type { UserNotificationProperties } from '$lib/properties/notification';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('notifications', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('send notifications', async () => {
		const mock = vi.spyOn(novu.subscribers, 'bulkCreate');

		const testBookTitle = 'My Book';

		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse._id
			})
		).result;

		const notifications: { [key: string]: UserNotificationProperties } = {};
		const notification = {
			senderName: testUserOne.user_metadata.firstName,
			receiverID: testUserTwo.id,
			receiverName: testUserTwo.user_metadata.firstName,
			receiverEmail: testUserTwo.email!,
			url: 'url',
			notification: 'test notification'
		};

		notifications[testUserTwo.id] = notification;

		await caller.storylines.update({
			id: storylines[0]._id,
			title: 'Default Storyline',
			notifications: notifications
		});

		expect(mock).toHaveBeenCalled();
	});
});
