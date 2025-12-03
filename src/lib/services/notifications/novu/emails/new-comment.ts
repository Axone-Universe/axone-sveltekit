import { render } from 'svelte-email';
import NewComment from '$lib/components/notifications/email-templates/new-comment.svelte';
import { Chapter } from '$lib/models/chapter';
import type { HydratedDocument } from 'mongoose';
import type { ChapterProperties } from '$lib/properties/chapter';
import type { BookProperties } from '$lib/properties/book';
import type { CommentProperties } from '$lib/properties/chapter';
import { PUBLIC_DOMAIN_NAME } from '$env/static/public';
import { getAdminUser } from '../admin-user';

export interface NewCommentEmailProps {
	chapterId: string;
	commentId: string;
}

export async function renderNewCommentEmail({ chapterId, commentId }: NewCommentEmailProps) {
	// Get admin user for aggregate query options (ensures correct permissions)
	const adminUser = await getAdminUser();

	// Fetch the chapter from the database with book populated
	const chapters = await Chapter.aggregate(
		[
			{
				$match: { _id: chapterId }
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
			user: adminUser,
			comments: true // Get all comments, not just the first 10
		}
	).exec();

	if (!chapters || chapters.length === 0) {
		throw new Error(`Chapter with ID ${chapterId} not found`);
	}

	const chapter = chapters[0] as HydratedDocument<ChapterProperties> & {
		book: HydratedDocument<BookProperties>;
	};

	if (!chapter.book) {
		throw new Error(`Book not found for chapter ${chapterId}`);
	}

	// Find the specific comment
	const comment = chapter.comments?.find((c: CommentProperties) => c._id === commentId);

	if (!comment) {
		throw new Error(`Comment with ID ${commentId} not found in chapter ${chapterId}`);
	}

	const book = chapter.book as HydratedDocument<BookProperties>;
	const origin = PUBLIC_DOMAIN_NAME;
	const chapterUrl = `${origin}/book/${book._id}?chapter=${chapterId}`;

	return render({
		template: NewComment,
		props: {
			chapterTitle: chapter.title || 'Untitled Chapter',
			bookTitle: book.title,
			commenterName: `${comment.firstName} ${comment.lastName}`,
			commenterImageURL: comment.imageURL,
			commentText: comment.comment,
			commentDate: comment.date,
			chapterUrl,
			origin
		} as any
	});
}
