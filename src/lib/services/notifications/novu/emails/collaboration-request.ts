import { render } from 'svelte-email';
import CollaborationRequest from '$lib/components/notifications/email-templates/collaboration-request.svelte';
import { User } from '$lib/models/user';
import { Book } from '$lib/models/book';
import { Chapter } from '$lib/models/chapter';
import { Storyline } from '$lib/models/storyline';
import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from '$lib/properties/user';
import type { BookProperties } from '$lib/properties/book';
import type { ChapterProperties } from '$lib/properties/chapter';
import type { StorylineProperties } from '$lib/properties/storyline';
import type { PermissionedDocument } from '$lib/properties/permission';
import { PUBLIC_DOMAIN_NAME } from '$env/static/public';
import { getAdminUser } from '../admin-user';
import { documentURL } from '$lib/util/links';

export interface CollaborationRequestEmailProps {
	userId: string;
	documentType: PermissionedDocument;
	documentId: string;
}

export async function renderCollaborationRequestEmail({
	userId,
	documentType,
	documentId
}: CollaborationRequestEmailProps) {
	const adminUser = await getAdminUser();
	const origin = PUBLIC_DOMAIN_NAME;

	// Fetch the requesting user
	const users = await User.aggregate(
		[
			{
				$match: { _id: userId }
			}
		],
		{
			user: adminUser
		}
	).exec();

	if (!users || users.length === 0) {
		throw new Error(`User with ID ${userId} not found`);
	}

	const requestingUser = users[0] as HydratedDocument<UserProperties>;
	const requesterName = requestingUser.firstName && requestingUser.lastName
		? `${requestingUser.firstName} ${requestingUser.lastName}`
		: requestingUser.email || 'Someone';
	const requesterImageURL = requestingUser.imageURL;

	// Fetch the document based on type
	let document:
		| HydratedDocument<BookProperties>
		| HydratedDocument<ChapterProperties>
		| HydratedDocument<StorylineProperties>;
	let documentTitle: string;
	let documentUrl: string;
	let documentOwnerId: string;

	switch (documentType) {
		case 'Book': {
			const books = await Book.aggregate(
				[
					{
						$match: { _id: documentId }
					}
				],
				{
					user: adminUser
				}
			).exec();

			if (!books || books.length === 0) {
				throw new Error(`Book with ID ${documentId} not found`);
			}

			document = books[0] as HydratedDocument<BookProperties>;
			documentTitle = document.title || 'Untitled Book';
			documentUrl = documentURL(origin, 'Book', document);
			documentOwnerId = typeof document.user === 'string' ? document.user : document.user?._id || '';
			break;
		}

		case 'Chapter': {
			const chapters = await Chapter.aggregate(
				[
					{
						$match: { _id: documentId }
					},
					{
						$lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'book' }
					},
					{
						$unwind: {
							path: '$book',
							preserveNullAndEmptyArrays: true
						}
					}
				],
				{
					user: adminUser
				}
			).exec();

			if (!chapters || chapters.length === 0) {
				throw new Error(`Chapter with ID ${documentId} not found`);
			}

			document = chapters[0] as HydratedDocument<ChapterProperties> & {
				book: HydratedDocument<BookProperties>;
			};
			documentTitle = document.title || 'Untitled Chapter';
			documentUrl = documentURL(origin, 'Chapter', document);
			documentOwnerId = typeof document.user === 'string' ? document.user : document.user?._id || '';
			break;
		}

		case 'Storyline': {
			const storylines = await Storyline.aggregate(
				[
					{
						$match: { _id: documentId }
					},
					{
						$lookup: { from: 'books', localField: 'book', foreignField: '_id', as: 'book' }
					},
					{
						$unwind: {
							path: '$book',
							preserveNullAndEmptyArrays: true
						}
					}
				],
				{
					user: adminUser
				}
			).exec();

			if (!storylines || storylines.length === 0) {
				throw new Error(`Storyline with ID ${documentId} not found`);
			}

			document = storylines[0] as HydratedDocument<StorylineProperties> & {
				book: HydratedDocument<BookProperties>;
			};
			documentTitle = document.title || 'Untitled Storyline';
			documentUrl = documentURL(origin, 'Storyline', document);
			documentOwnerId = typeof document.user === 'string' ? document.user : document.user?._id || '';
			break;
		}

		default:
			throw new Error(`Unknown document type: ${documentType}`);
	}

	// Check if the requesting user is the owner of the document
	const isOwner = userId === documentOwnerId;

	return render({
		template: CollaborationRequest,
		props: {
			requesterName,
			requesterImageURL,
			documentType,
			documentTitle,
			documentUrl,
			origin,
			isOwner
		} as any
	});
}

