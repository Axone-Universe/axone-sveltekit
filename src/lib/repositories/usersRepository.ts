import { User } from '$lib/models/user';
import { Repository } from '$lib/repositories/repository';
import type { UserProperties } from '$lib/shared/user';
import type { HydratedDocument } from 'mongoose';

export class UsersRepository extends Repository {
	async get(
		uid?: string,
		limit?: number,
		skip?: number
	): Promise<HydratedDocument<UserProperties>[]> {
		let query = User.find(uid ? { _id: uid } : {});

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

	async getById(id?: string): Promise<HydratedDocument<UserProperties>> {
		const user = await User.findById(id);

		return new Promise<HydratedDocument<UserProperties>>((resolve) => {
			resolve(user);
		});
	}

	getByTitle(
		searchTerm?: string | undefined,
		limit?: number | undefined,
		skip?: number | undefined
	): Promise<unknown[]> {
		throw new Error('Method not implemented.');
	}
}
