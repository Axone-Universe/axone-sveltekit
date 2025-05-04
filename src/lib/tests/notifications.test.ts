import { router } from '$lib/trpc/router';
import { vi, expect, describe } from 'vitest';
import * as novu from '$lib/util/notifications/novu';
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
import { NotificationType } from '$lib/util/types';

beforeAll(async () => {
	await connectTestDatabase();
});

describe('notifications', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('send notifications', async () => {
		const mock = vi.spyOn(novu, 'sendNotifications');

		const testBookTitle = 'My Book';

		const testUserOneSession = createTestSession(testUserOne);

		await createDBUser(testUserOneSession);
		const bookResponse = await createBook(testUserOneSession, testBookTitle);

		// get the default storyline from created book
		const caller = router.createCaller({ session: testUserOneSession });
		const storylines = (
			await caller.storylines.get({
				bookID: bookResponse.data._id
			})
		).data;

		const notifications: { [key: string]: UserNotificationProperties } = {};
		const notification = {
			url: 'url',
			type: 'USER' as NotificationType,
			senderID: testUserOne.id,
			receiverID: testUserTwo.id,
			notification: 'test notification',
			subject: 'test notification'
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
