import type { HydratedDocument } from 'mongoose';
import type { BookProperties } from '$lib/properties/book';
import type { ChapterProperties } from '$lib/properties/chapter';
import type { StorylineProperties } from '$lib/properties/storyline';
import type { PermissionProperties, PermissionedDocument } from '$lib/properties/permission';
import type { UserNotificationProperties } from '$lib/properties/notification';
import { documentURL } from '$lib/util/links';
import { PUBLIC_DOMAIN_NAME } from '$env/static/public';

/**
 * Builds user notifications for new permissions on a document
 * New permissions are identified by checking if the _id field is an empty string
 *
 * @param document - The document (Book, Chapter, or Storyline) that permissions are being set on
 * @param documentType - The type of document ('Book', 'Chapter', or 'Storyline')
 * @param senderID - The ID of the user granting the permissions
 * @param newPermissions - The permissions object with user IDs as keys
 * @param origin - The origin URL for building document URLs (e.g., 'https://example.com')
 * @returns A record of user notifications keyed by user ID
 */
export function buildPermissionNotifications(
	document:
		| HydratedDocument<BookProperties>
		| HydratedDocument<ChapterProperties>
		| HydratedDocument<StorylineProperties>,
	documentType: PermissionedDocument,
	senderID: string,
	newPermissions: Record<string, PermissionProperties>,
	origin?: string
): Record<string, UserNotificationProperties> {
	const notifications: Record<string, UserNotificationProperties> = {};
	const originToUse = origin || PUBLIC_DOMAIN_NAME || '';
	const documentURLPath = documentURL(originToUse, documentType, document);

	// Extract document title based on type
	let documentTitle: string;
	switch (documentType) {
		case 'Book': {
			const book = document as HydratedDocument<BookProperties>;
			documentTitle = book.title || 'Untitled Book';
			break;
		}
		case 'Chapter': {
			const chapter = document as HydratedDocument<ChapterProperties>;
			documentTitle = chapter.title || 'Untitled Chapter';
			break;
		}
		case 'Storyline': {
			const storyline = document as HydratedDocument<StorylineProperties>;
			documentTitle = storyline.title || 'Untitled Storyline';
			break;
		}
		default:
			documentTitle = 'Untitled Document';
	}

	// Find new permissions (permissions with empty _id string)
	for (const [userID, permission] of Object.entries(newPermissions)) {
		// Skip 'public' permission and the sender
		if (userID === 'public' || userID === senderID) {
			continue;
		}

		// Check if this is a new permission (empty _id indicates new permission)
		if (permission._id === '') {
			const permissionType = permission.permission === 'collaborate' ? 'collaborate on' : 'view';
			notifications[userID] = {
				url: documentURLPath,
				type: 'USER',
				subject: `You've been granted ${permissionType} access to "${documentTitle}"`,
				senderID: senderID,
				receiverID: userID,
				notification: `You've been granted ${permissionType} access to "${documentTitle}"`
			};
		}
	}

	return notifications;
}
