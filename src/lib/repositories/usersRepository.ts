import { DBSession } from '$lib/db/session';
import type { UserResponse } from '$lib/nodes/user';
import { Repository } from '$lib/repositories/repository';

export class UsersRepository extends Repository {
	async get(uid?: string, limit?: number, skip?: number): Promise<UserResponse[]> {
		const query = `
			MATCH (user:User) 
			${uid ? `WHERE user.id = '${uid}'` : ''}
			RETURN user
			ORDER BY user.name
			${skip ? `SKIP ${skip}` : ''}
			${limit ? `LIMIT ${limit}` : ''}
		`;

		const session = new DBSession();
		const result = await session.executeRead<UserResponse>(query);

		const users: UserResponse[] = [];
		result.records.forEach((record) => {
			users.push(record.toObject());
		});

		return new Promise<UserResponse[]>((resolve) => {
			resolve(users);
		});
	}

	async count(): Promise<number> {
		const count = await this._count('User');

		return new Promise<number>((resolve) => {
			resolve(count);
		});
	}

	getById(
		searchTerm?: string | undefined,
		limit?: number | undefined,
		skip?: number | undefined
	): Promise<unknown> {
		throw new Error('Method not implemented.');
	}
	getByTitle(
		searchTerm?: string | undefined,
		limit?: number | undefined,
		skip?: number | undefined
	): Promise<unknown[]> {
		throw new Error('Method not implemented.');
	}
}
