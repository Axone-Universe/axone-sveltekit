import { UserBuilder } from '$lib/documents/user';
import { UsersRepository } from '$lib/repositories/usersRepository';
import { auth } from '$lib/trpc/middleware/auth';
import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import type { Response } from '$lib/util/types';

import {
	create,
	createDeleteReadingList,
	read,
	getReadingList,
	update,
	updateReadingLists,
	renameReadingList,
	updateUserAsAdmin,
	redeemReward
} from '$lib/trpc/schemas/users';
import type { HydratedDocument } from 'mongoose';
import type { UserProperties } from '$lib/properties/user';
import { createNotificationSubscriber, subscribeToTopic } from '$lib/util/notifications/novu';

export const users = t.router({
	get: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();

			const response: Response = {
				success: true,
				message: 'user successfully retrieved',
				data: {}
			};
			try {
				const result = await usersRepo.get(ctx, input);
				response.data = result;
				response.cursor = result.length > 0 ? (input.cursor ?? 0) + result.length : undefined;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties>[] } };
		}),
	getById: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();

			const response: Response = {
				success: true,
				message: 'user successfully retrieved',
				data: {}
			};
			try {
				const result = await usersRepo.getById(ctx, input.id);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),
	getByIds: t.procedure
		.use(logger)
		.input(read)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();

			const response: Response = {
				success: true,
				message: 'user successfully retrieved',
				data: {}
			};
			try {
				const result = await usersRepo.getByIds(ctx, input.ids);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}
			return {
				...response,
				...{ data: response.data as HydratedDocument<UserProperties>[] | null }
			};
		}),
	update: t.procedure
		.use(logger)
		.use(auth)
		.input(update)
		.mutation(async ({ input, ctx }) => {
			let userBuilder = new UserBuilder(ctx.session!.user.id).sessionUser(ctx.user!);

			if (input.firstName) userBuilder = userBuilder.firstName(input.firstName);
			if (input.lastName) userBuilder = userBuilder.lastName(input.lastName);

			if (input.ambassador !== undefined) userBuilder = userBuilder.ambassador(input.ambassador);
			if (input.imageURL) userBuilder = userBuilder.imageURL(input.imageURL);
			if (input.about) userBuilder = userBuilder.about(input.about);
			if (input.email) userBuilder = userBuilder.email(input.email);
			if (input.facebook) userBuilder = userBuilder.facebook(input.facebook);
			if (input.instagram) userBuilder = userBuilder.instagram(input.instagram);
			if (input.twitter) userBuilder = userBuilder.twitter(input.twitter);
			if (input.genres) userBuilder = userBuilder.genres(input.genres);
			if (input.labels) userBuilder = userBuilder.labels(input.labels);
			if (input.referralSource) userBuilder = userBuilder.referralSource(input.referralSource);
			if (input.referralAboutSource)
				userBuilder = userBuilder.referralAboutSource(input.referralAboutSource);
			if (input.referralSocialMediaSource)
				userBuilder = userBuilder.referralSocialMediaSource(input.referralSocialMediaSource);
			if (input.referralUser) userBuilder = userBuilder.referralUser(input.referralUser);

			const response: Response = {
				success: true,
				message: 'update successfull',
				data: {}
			};
			try {
				const result = await userBuilder.update();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),

	create: t.procedure
		.use(logger)
		.use(auth)
		.input(create)
		.mutation(async ({ input, ctx }) => {
			let userBuilder = new UserBuilder(ctx.session!.user.id)
				.firstName(input.firstName!)
				.lastName(input.lastName!);

			if (input.admin) userBuilder = userBuilder.admin(input.admin);
			if (input.ambassador !== undefined) userBuilder = userBuilder.ambassador(input.ambassador);
			if (input.imageURL) userBuilder = userBuilder.imageURL(input.imageURL);
			if (input.about) userBuilder = userBuilder.about(input.about);
			if (input.email) userBuilder = userBuilder.email(input.email);
			if (input.facebook) userBuilder = userBuilder.facebook(input.facebook);
			if (input.instagram) userBuilder = userBuilder.instagram(input.instagram);
			if (input.twitter) userBuilder = userBuilder.twitter(input.twitter);
			if (input.genres) userBuilder = userBuilder.genres(input.genres);
			if (input.labels) userBuilder = userBuilder.labels(input.labels);
			if (input.referralSource) userBuilder = userBuilder.referralSource(input.referralSource);
			if (input.referralAboutSource)
				userBuilder = userBuilder.referralAboutSource(input.referralAboutSource);
			if (input.referralSocialMediaSource)
				userBuilder = userBuilder.referralSocialMediaSource(input.referralSocialMediaSource);
			if (input.referralUser) userBuilder = userBuilder.referralUser(input.referralUser);

			const response: Response = {
				success: true,
				message: 'user successfully created',
				data: {}
			};
			try {
				const result = await userBuilder.build();
				response.data = result;
				createNotificationSubscriber(result);
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> } };
		}),

	getReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(getReadingList)
		.query(async ({ input, ctx }) => {
			const usersRepo = new UsersRepository();

			const response: Response = {
				success: true,
				message: 'reading list retrieved',
				data: {}
			};
			try {
				const result = await usersRepo.getReadingList(ctx.session!.user.id, input.name);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as any[] } };
		}),

	createReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(createDeleteReadingList)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'reading list created',
				data: {}
			};

			try {
				const result = await new UserBuilder(ctx.session!.user.id)
					.sessionUser(ctx.user!)
					.createReadingList(input);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),

	deleteReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(createDeleteReadingList)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'reading list deleted',
				data: {}
			};

			try {
				const result = await new UserBuilder(ctx.session!.user.id)
					.sessionUser(ctx.user!)
					.deleteReadingList(input);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),

	renameReadingList: t.procedure
		.use(logger)
		.use(auth)
		.input(renameReadingList)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'reading list renamed',
				data: {}
			};

			try {
				const result = await new UserBuilder(ctx.session!.user.id)
					.sessionUser(ctx.user!)
					.renameReadingList(input);
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),

	updateReadingLists: t.procedure
		.use(logger)
		.use(auth)
		.input(updateReadingLists)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'reading list updated',
				data: {}
			};

			try {
				const result = await new UserBuilder(ctx.session!.user.id)
					.sessionUser(ctx.user!)
					.updateReadingLists(input);

				if (input.storylineID) {
					subscribeToTopic(input.storylineID, ctx.session!.user.id);
				}
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unkown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),

	updateUserAsAdmin: t.procedure
		.use(logger)
		.use(auth)
		.input(updateUserAsAdmin)
		.mutation(async ({ input, ctx }) => {
			// Check if the current user is an admin
			if (!ctx.user?.admin) {
				return {
					success: false,
					message: 'Unauthorized: Only admins can update other users',
					data: null
				};
			}

			const response: Response = {
				success: true,
				message: 'user ambassador status updated',
				data: {}
			};

			try {
				const result = await new UserBuilder(input.userId)
					.sessionUser(ctx.user!)
					.ambassador(input.ambassador)
					.update();
				response.data = result;
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unknown error';
			}

			return { ...response, ...{ data: response.data as HydratedDocument<UserProperties> | null } };
		}),

	getReferralCount: t.procedure
		.use(logger)
		.use(auth)
		.query(async ({ ctx }) => {
			const response: Response = {
				success: true,
				message: 'referral count retrieved',
				data: { count: 0 }
			};

			try {
				// Count users where referralUser equals the current user's ID
				const usersRepo = new UsersRepository();
				const count = await usersRepo.countReferrals(ctx.session!.user.id);
				response.data = { count };
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unknown error';
			}

			return { ...response, ...{ data: response.data as { count: number } } };
		}),

	redeemReward: t.procedure
		.use(logger)
		.use(auth)
		.input(redeemReward)
		.mutation(async ({ input, ctx }) => {
			const response: Response = {
				success: true,
				message: 'reward redeemed successfully',
				data: {}
			};

			try {
				// Get referral count to verify points
				const usersRepo = new UsersRepository();
				const referralCount = await usersRepo.countReferrals(ctx.session!.user.id);
				const totalPoints = referralCount * 10;

				// Check if user has enough points
				if (totalPoints < input.points) {
					response.success = false;
					response.message = 'Insufficient points';
					return response;
				}

				// TODO: Implement reward redemption logic
				// This should:
				// 1. Deduct points from user (track redeemed rewards in a separate collection)
				// 2. Generate and send voucher code via email
				// 3. Log the redemption for tracking

				// For now, we'll just return success
				response.data = {
					message: `Reward of ${input.rewardValue} will be sent to your email within 24-48 hours`,
					pointsRedeemed: input.points,
					remainingPoints: totalPoints - input.points
				};
			} catch (error) {
				response.success = false;
				response.message = error instanceof Object ? error.toString() : 'unknown error';
			}

			return response;
		})
});
