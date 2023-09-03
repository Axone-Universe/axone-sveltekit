import { User } from '$lib/models/user';
import { Repository } from '$lib/repositories/repository';
import type { UserProperties } from '$lib/shared/user';
import type { Session } from '@supabase/supabase-js';
import type { HydratedDocument } from 'mongoose';

export class UsersRepository extends Repository {
	async getAll(
		session: Session | null,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<UserProperties>[]> {
		const pipeline = [];

		pipeline.push({ $match: {} });
		if (limit) pipeline.push({ $limit: limit });
		if (skip) pipeline.push({ $skip: skip });

		const users = (await User.aggregate(pipeline, {
			userID: session?.user.id
		})) as HydratedDocument<UserProperties>[];

		return new Promise<HydratedDocument<UserProperties>[]>((resolve) => {
			resolve(users);
		});
	}

	async getById(
		session: Session | null,
		uid?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<UserProperties>> {
		let query = User.findById(uid ? { _id: uid } : {});

		if (skip) {
			query = query.skip(skip);
		}

		if (limit) {
			query = query.limit(limit);
		}

		const users = await query;

		return new Promise<HydratedDocument<UserProperties>>((resolve) => {
			resolve(users);
		});
	}

	/**
	 * Performs a fuzzy search
	 * @param session
	 * @param uid
	 * @param limit
	 * @param skip
	 * @returns
	 */
	async getByDetails(
		session: Session | null,
		searchTerm: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<UserProperties>[]> {
		let query = User.find({
			$or: [
				{ email: { $regex: '^' + searchTerm, $options: 'i' } },
				{ firstName: { $regex: '^' + searchTerm, $options: 'i' } },
				{ lastName: { $regex: '^' + searchTerm, $options: 'i' } }
			]
		});

		if (skip) {
			query = query.skip(skip);
		}

		if (limit) {
			query = query.limit(limit);
		}

		const users = await query;

		return new Promise<HydratedDocument<UserProperties>[]>((resolve) => {
			resolve(users);
		});
	}

	async count(): Promise<number> {
		const count = await User.count();

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}
}
