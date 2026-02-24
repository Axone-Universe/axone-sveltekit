import { ChapterBuilder } from '$lib/documents/digital-products/chapter';
import { ChaptersRepository } from '$lib/repositories/chaptersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import {
	create,
	createComment,
	deleteComment,
	getById,
	readFromStoryline,
	update
} from '$lib/trpc/schemas/chapters';
import { read } from '$lib/trpc/schemas/chapters';
import { sendUserNotifications } from '$lib/util/notifications/novu';
import { triggerPermissionWorkflow } from '$lib/services/notifications/novu/triggers/permission';
import { triggerNewCommentWorkflow } from '$lib/services/notifications/novu/triggers/comment';
import { setArchived } from '../schemas/shared';
import type { Response } from '$lib/util/types';
import type { ChapterProperties, CommentProperties } from '$lib/properties/chapter';
import type { HydratedDocument } from 'mongoose';
import type mongoose from 'mongoose';

export const chapters = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const chaptersRepo = new ChaptersRepository();

			const response: Response = {
				success: true,
				message: 'chapters successfully obtained',
				data: {}
			};
			try {
				const result = await chaptersRepo.get(ctx, input);

				response.data = result;
				response.cursor = result.length > 0 ? (input.cursor ?? 0) + result.length : undefined;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<ChapterProperties>[] } };
		}),

	getChaptersByUserID: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const chaptersRepo = new ChaptersRepository();

			const response: Response = {
				success: true,
				message: 'chapters successfully obtained',
				data: {}
			};
			try {
				const result = await chaptersRepo.getChaptersByUserID(ctx, input?.searchTerm);

				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<ChapterProperties>[] } };
		}),

	getById: t.procedure
		.use(logger)
		.input(getById)
		.query(async ({ input, ctx }) => {
			const chaptersRepo = new ChaptersRepository();

			const response: Response = {
				success: true,
				message: 'chapters successfully obtained',
				data: {}
			};
			try {
				const result = await chaptersRepo.getById(ctx, input.id);

				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<ChapterProperties> } };
		}),

	getByStoryline: t.procedure
		.use(logger)
		.input(readFromStoryline)
		.query(async ({ input, ctx }) => {
			const chaptersRepo = new ChaptersRepository();

			const response: Response = {
				success: true,
				message: 'chapters successfully obtained',
				data: {}
			};
			try {
				const result = await chaptersRepo.getByChapterIDs(
					ctx,
					input.storylineID,
					input.storylineChapterIDs,
					input.toChapterID
				);

				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<ChapterProperties>[] } };
		}),

	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const chapterBuilder = new ChapterBuilder(input.id).sessionUser(ctx.user!);

			if (input.description) chapterBuilder.description(input.description);
			if (input.title) chapterBuilder.title(input.title);
			if (input.permissions) chapterBuilder.permissions(input.permissions as any);

			const response: Response = {
				success: true,
				message: 'chapters successfully updated',
				data: {}
			};

			try {
				const result = await chapterBuilder.update();

				// Send notifications for new permissions (identified by empty _id)
				if (input.permissions) {
					// Trigger workflow for each new permission
					for (const [userID, permission] of Object.entries(input.permissions)) {
						// Skip 'public' permission and the sender
						if (userID === 'public' || userID === ctx.session!.user.id) {
							continue;
						}

						// Check if this is a new permission (empty _id indicates new permission)
						if (permission._id === '') {
							await triggerPermissionWorkflow({
								documentType: 'Chapter',
								documentId: result._id,
								senderId: ctx.session!.user.id,
								receiverId: userID
							});
						}
					}
				}

				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<ChapterProperties> } };
		}),

	setArchived: t.procedure
		.use(logger)
		.use(auth)
		.input(setArchived)
		.mutation(async ({ input, ctx }) => {
			const chapterBuilder = new ChapterBuilder()
				.sessionUser(ctx.user!)
				.userID(ctx.session!.user.id)
				.archived(input.archived);

			const response: Response = {
				success: true,
				message: 'chapters successfully archived',
				data: {}
			};
			try {
				const result = await chapterBuilder.setArchived(input.ids);

				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as boolean } };
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			const chapterBuilder = new ChapterBuilder()
				.sessionUser(ctx.user!)
				.userID(ctx.session!.user.id)
				.title(input.title)
				.bookID(input.bookID)
				.storylineID(input.storylineID)
				.description(input.description);

			if (input.prevChapterID) chapterBuilder.prevChapterID(input.prevChapterID);
			if (input.permissions) chapterBuilder.permissions(input.permissions as any);

			const response: Response = {
				success: true,
				message: 'chapter successfully created',
				data: {}
			};

			try {
				const result = await chapterBuilder.build();

				// Send notifications for new permissions
				if (input.permissions) {
					// Trigger workflow for each new permission
					for (const [userID, permission] of Object.entries(input.permissions)) {
						// Skip 'public' permission and the sender
						if (userID === 'public' || userID === ctx.session!.user.id) {
							continue;
						}

						// Check if this is a new permission (empty _id indicates new permission)
						if (permission._id === '') {
							await triggerPermissionWorkflow({
								documentType: 'Chapter',
								documentId: result._id,
								senderId: ctx.session!.user.id,
								receiverId: userID
							});
						}
					}
				}

				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<ChapterProperties> } };
		}),

	delete: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			const chapterBuilder = new ChapterBuilder(input.id).sessionUser(ctx.user!);

			const response: Response = {
				success: true,
				message: 'chapter successfully deleted',
				data: {}
			};
			try {
				const result = await chapterBuilder.delete();

				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as mongoose.mongo.DeleteResult } };
		}),

	createComment: t.procedure
		.use(logger)
		.use(auth)
		.input(createComment)
		.mutation(async ({ input, ctx }) => {
			const chapterBuilder = new ChapterBuilder(input.chapterId).sessionUser(ctx.user!);

			const response: Response = {
				success: true,
				message: 'comment successfully created',
				data: {}
			};
			try {
				const result = await chapterBuilder.createComment(input.comment);
				const newComment = result.comments?.at(0);
				response.data = newComment;

				// Trigger new comment workflow
				if (newComment) {
					// Get chapter owner to send notification
					const chaptersRepo = new ChaptersRepository();
					const chapter = await chaptersRepo.getById(ctx, input.chapterId);

					// Get chapter owner ID (skip if commenter is the owner)
					const chapterOwnerId =
						typeof chapter.user === 'string' ? chapter.user : chapter.user?._id;

					// Only send notification if the commenter is not the chapter owner
					if (chapterOwnerId && chapterOwnerId !== ctx.session!.user.id) {
						await triggerNewCommentWorkflow({
							chapterId: input.chapterId,
							commentId: newComment._id,
							recipientId: chapterOwnerId
						});
					}
				}
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<CommentProperties> } };
		}),

	deleteComment: t.procedure
		.use(logger)
		.use(auth)
		.input(deleteComment)
		.mutation(async ({ input, ctx }) => {
			const chapterBuilder = new ChapterBuilder(input.chapterId).sessionUser(ctx.user!);

			await chapterBuilder.deleteComment(input.commentId);

			const response: Response = {
				success: true,
				message: 'comment successfully deleted',
				data: {}
			};
			try {
				await chapterBuilder.update();
				response.data = input.commentId;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<CommentProperties> } };
		}),

	getComments: t.procedure
		.use(logger)
		.use(auth)
		.input(getById)
		.mutation(async ({ input, ctx }) => {
			const chaptersRepo = new ChaptersRepository();

			const response: Response = {
				success: true,
				message: 'chapter comments successfully obtained',
				data: {}
			};
			try {
				const result = await chaptersRepo.getComments(ctx, input);

				response.data = result;
				response.cursor = result.length;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<CommentProperties>[] } };
		})
});
