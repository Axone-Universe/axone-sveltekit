import { router } from '$lib/trpc/router';
import { vi, expect, describe } from 'vitest';
import * as novu from '$lib/util/notifications/novu';
import {
	cleanUpDatabase,
	connectDatabase,
	createDBUser,
	createBook,
	createTestSession,
	generateUserSessionData
} from '$lib/util/testing/testing';
import type { UserNotificationProperties } from '$lib/properties/notification';
import { NotificationType } from '$lib/util/types';

beforeAll(async () => {
	await connectDatabase();
});

describe('notifications', () => {
	beforeEach(async () => {
		await cleanUpDatabase();
	});

	test('send notifications', async () => {
		const mock = vi.spyOn(novu, 'sendNotifications');

		const testBookTitle = 'My Book';

		const testUserOneSession = createTestSession(generateUserSessionData());
		const testUserTwoSession = createTestSession(generateUserSessionData());

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
			senderID: testUserOneSession.user.id,
			receiverID: testUserTwoSession.user.id,
			notification: 'test notification',
			subject: 'test notification'
		};

		notifications[testUserTwoSession.user.id] = notification;

		await caller.storylines.update({
			id: storylines[0]._id,
			title: 'Default Storyline',
			notifications: notifications
		});

		expect(mock).toHaveBeenCalled();
	});
});
