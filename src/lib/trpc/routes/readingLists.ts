import { logger } from '$lib/trpc/middleware/logger';
import { t } from '$lib/trpc/t';
import type { Response } from '$lib/util/types';
import { User } from '$lib/models/user';

export const readingLists = t.router({
	getAdminReadingLists: t.procedure.use(logger).query(async () => {
		const response: Response = {
			success: true,
			message: 'admin reading lists successfully retrieved',
			data: {}
		};

		try {
			// Find all admin users
			const adminUsers = await User.find({ admin: true }).select(
				'_id firstName lastName imageURL readingLists'
			);

			// Transform reading lists into a flat array with metadata
			const adminReadingLists: {
				name: string;
				storylineIds: string[];
				curatorId: string;
				curatorName: string;
				curatorImageURL?: string;
			}[] = [];

			adminUsers.forEach((user) => {
				if (user.readingLists) {
					const readingListsMap = user.readingLists as Map<string, string[]>;
					readingListsMap.forEach((storylineIds, listName) => {
						if (storylineIds.length > 0) {
							adminReadingLists.push({
								name: listName,
								storylineIds: storylineIds,
								curatorId: user._id,
								curatorName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
								curatorImageURL: user.imageURL
							});
						}
					});
				}
			});

			response.data = adminReadingLists;
		} catch (error) {
			response.success = false;
			response.message = error instanceof Object ? error.toString() : 'unknown error';
		}

		return {
			...response,
			...{
				data: response.data as {
					name: string;
					storylineIds: string[];
					curatorId: string;
					curatorName: string;
					curatorImageURL?: string;
				}[]
			}
		};
	})
});
